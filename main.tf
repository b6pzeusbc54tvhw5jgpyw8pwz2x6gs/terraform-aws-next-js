data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  # next-tf config
  config_dir           = trimsuffix(var.next_tf_dir, "/")
  config_file          = jsondecode(file("${local.config_dir}/config.json"))
  proxy_config_json    = file("${local.config_dir}/proxy-config.json")
  lambdas              = lookup(local.config_file, "lambdas", {})
  static_files_archive = "${local.config_dir}/${lookup(local.config_file, "staticFilesArchive", "")}"

  # Build the proxy config JSON
  config_file_images   = lookup(local.config_file, "images", {})
  config_file_version  = lookup(local.config_file, "version", 0)
  buildId              = lookup(local.config_file, "buildId")
  name_suffix          = var.name_suffix == null ? random_id.suffix.hex : var.name_suffix

  account_id           = data.aws_caller_identity.current.account_id
  region_name          = data.aws_region.current.name
}

resource "random_id" "suffix" {
  byte_length = 4
}


# Static deployment to S3 website
module "statics_deploy" {
  source = "./modules/statics-deploy"

  build_id                         = local.buildId
  name_prefix                      = var.name_prefix
  name_suffix                      = local.name_suffix
  static_files_archive             = local.static_files_archive
  expire_static_assets             = var.expire_static_assets
  package_abs_path                 = var.static_deploy_package_abs_path
  cloudfront_id                    = module.proxy.cloudfront_id
  cloudfront_arn                   = module.proxy.cloudfront_arn
  tags                             = var.tags
  lambda_role_permissions_boundary = var.lambda_role_permissions_boundary
  use_manual_app_deploy            = var.use_manual_app_deploy
}

########
# Lambda
########

resource "aws_lambda_function" "this" {
  for_each      = var.use_manual_app_deploy ? {} : local.lambdas

  function_name = each.key  # function name should contain buildId
  description   = "${var.name_prefix} Managed by Terraform-next.js"
  role          = aws_iam_role.lambda.arn
  handler       = lookup(each.value, "handler", "")
  runtime       = lookup(each.value, "runtime", var.lambda_runtime)
  memory_size   = lookup(each.value, "memory", var.lambda_memory_size)
  timeout       = lookup(each.value, "timeout", var.lambda_timeout)
  tags          = var.tags
  publish       = true

  filename         = "${local.config_dir}/${lookup(each.value, "filename", "")}"
  source_code_hash = filebase64sha256("${local.config_dir}/${lookup(each.value, "filename", "")}")

  dynamic "environment" {
    for_each = length(var.lambda_environment_variables) > 0 ? [true] : []
    content {
      variables = var.lambda_environment_variables
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_logs, aws_cloudwatch_log_group.this]
}

# Lambda invoke permission

resource "aws_lambda_permission" "current_version_triggers" {
  for_each = var.use_manual_app_deploy ? {} : local.lambdas

  statement_id  = "AllowInvokeFromApiGateway"
  action        = "lambda:InvokeFunction"
  # for alias
  # function_name = "${each.key}:LIVE"
  function_name = each.key
  principal     = "apigateway.amazonaws.com"

  source_arn = "${module.api_gateway.this_apigatewayv2_api_execution_arn}/*/*/*"
}

#############################
# Cloudwatch Logs (λ Next.js)
#############################

resource "aws_cloudwatch_log_group" "this" {
  for_each          = var.use_manual_app_deploy ? {} : local.lambdas

  name              = "/aws/lambda/${each.key}"
  retention_in_days = 14

  tags              = var.tags
}

#############
# Api-Gateway
#############

locals {
  integrations_keys = var.use_manual_app_deploy ? [] : flatten([
    for integration_key, integration in local.lambdas : [
      "ANY ${lookup(integration, "route", "")}/{proxy+}"
    ]
  ])
  integration_values = var.use_manual_app_deploy ? [] : flatten([
    for integration_key, integration in local.lambdas : {
      lambda_arn             = aws_lambda_function.this[integration_key].arn
      # for specific alias
      # lambda_arn             = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.this[integration_key].arn}:$${stageVariables.lambdaAlias}/invocations"
      payload_format_version = "2.0"
      timeout_milliseconds   = var.lambda_timeout * 1000
    }
  ])
  integrations = zipmap(local.integrations_keys, local.integration_values)
}

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "0.8.0"

  name          = "${var.name_prefix}-${local.name_suffix}"
  description   = "${var.name_prefix} Managed by Terraform-next.js"
  protocol_type = "HTTP"

  create_api_domain_name = false

  integrations = var.use_manual_app_deploy ? {} : local.integrations

  tags = var.tags
}

#########################################
# Cloudfront for accelerating Api-Gateway
#########################################

module "ssr_cf" {
  source = "terraform-aws-modules/cloudfront/aws"

  comment             = "${var.name_prefix} Nextjs SSR"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  retain_on_delete    = false
  wait_for_deployment = true

  create_origin_access_identity = false

  logging_config = var.enable_log ? {
    bucket          = var.log_bucket_domain_name
    prefix          = "${var.log_prefix_of_prefix}-cloudfront-ssr"
    include_cookies = var.log_include_cookies
  } : null

  origin = {
    ssr-api-gateway = {
      domain_name = trimprefix(module.api_gateway.this_apigatewayv2_api_api_endpoint, "https://")
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "match-viewer"
        origin_ssl_protocols   = ["TLSv1.2"]
        origin_keepalive_timeout = 60
        origin_read_timeout      = 5
      }
    }
  }

  default_cache_behavior = {
    target_origin_id       = "ssr-api-gateway"
    viewer_protocol_policy = "allow-all"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true
    query_string    = true
    min_ttl         = 0
    default_ttl     = 0
    max_ttl         = 86400

    query_string              = var.cloudfront_query_string
    query_string_cache_keys   = var.cloudfront_query_string_cache_keys
    headers                   = var.cloudfront_headers
    cookies_forward           = var.cloudfront_cookies_forward
    cookies_whitelisted_names = var.cloudfront_cookies_whitelisted_names
  }
}

##############
# Proxy Config
##############

module "proxy_config" {
  source = "./modules/proxy-config"

  name_prefix            = var.name_prefix
  cloudfront_price_class = var.cloudfront_price_class
  proxy_config_json      = local.proxy_config_json
  deployment_name        = var.deployment_name
  log_bucket_domain_name = var.log_bucket_domain_name
  tags                   = var.tags
  use_manual_app_deploy  = var.use_manual_app_deploy
}

############
# Next/Image
############

# Permission for image optimizer to fetch images from S3 deployment
data "aws_iam_policy_document" "access_static_deployment" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.statics_deploy.static_deploy_bucket_arn}/*"]
  }
}

module "next_image" {
  count = var.create_image_optimization ? 1 : 0

  source  = "github.com/b6pzeusbc54tvhw5jgpyw8pwz2x6gs/terraform-aws-next-js-image-optimization"
  # version = "2.0.0"
  # source  = "../terraform-aws-next-js-image-optimization"

  cloudfront_create_distribution = false
  next_image_path_prefix         = var.next_image_path_prefix
  next_image_package_abs_path    = var.next_image_package_abs_path

  # tf-next does not distinct between image and device sizes, because they
  # are eventually merged together on the image optimizer.
  # So we only use a single key (next_image_domains) to pass ALL (image &
  # device) sizes to the optimizer and by setting the other
  # (next_image_device_sizes) to an empty array which prevents the optimizer
  # from adding the default device settings
  next_image_domains      = lookup(local.config_file_images, "domains", [])
  # next_image_device_sizes = []
  # next_image_image_sizes  = lookup(local.config_file_images, "sizes", [])
  next_image_device_sizes = var.next_image_device_sizes
  next_image_image_sizes  = var.next_image_image_sizes

  source_bucket_id = module.statics_deploy.static_deploy_bucket_id

  lambda_attach_policy_json        = true
  lambda_policy_json               = data.aws_iam_policy_document.access_static_deployment.json
  lambda_role_permissions_boundary = var.lambda_role_permissions_boundary

  deployment_name = var.deployment_name
  tags            = var.tags
}

##################
# CloudFront Proxy
##################
locals {
  next_image_cloudfront_origins = var.create_image_optimization ? [module.next_image[0].cloudfront_origin_image_optimizer] : []
  proxy_cloudfront_origins = var.cloudfront_origins != null ? merge(
    local.next_image_cloudfront_origins,
    var.cloudfront_origins
  ) : local.next_image_cloudfront_origins

  # Custom CloudFront beheaviour for image optimization
  next_image_custom_behavior = var.create_image_optimization ? [{
    path_pattern     = "/image/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = module.next_image[0].cloudfront_origin_image_optimizer.origin_id

    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    origin_request_policy_id = module.next_image[0].cloudfront_origin_request_policy_id
    cache_policy_id          = module.next_image[0].cloudfront_cache_policy_id
  }] : []

  cloudfront_custom_behaviors = var.cloudfront_custom_behaviors != null ? merge(
    local.next_image_custom_behavior,
    var.cloudfront_custom_behaviors
  ) : local.next_image_custom_behavior
}

#######
# Proxy
#######

module "proxy" {
  source = "./modules/proxy"

  ssr_server_domain_name        = module.ssr_cf.this_cloudfront_distribution_domain_name
  static_bucket_endpoint        = module.statics_deploy.static_bucket_endpoint
  static_bucket_access_identity = module.statics_deploy.static_bucket_access_identity
  proxy_config_version          = local.config_file_version
  proxy_config_endpoint         = module.proxy_config.config_endpoint

  # Forwarding log setting
  enable_log                    = var.enable_log
  log_bucket_domain_name        = var.log_bucket_domain_name
  log_prefix_of_prefix          = var.log_prefix_of_prefix
  log_include_cookies           = var.log_include_cookies

  # Forwarding variables
  name_prefix                          = var.name_prefix
  name_suffix                          = local.name_suffix
  package_abs_path                     = var.proxy_package_abs_path
  deployment_name                      = var.deployment_name
  proxy_config_ttl                     = var.proxy_config_ttl
  cloudfront_price_class               = var.cloudfront_price_class
  cloudfront_origins                   = local.proxy_cloudfront_origins
  cloudfront_custom_behaviors          = local.cloudfront_custom_behaviors
  cloudfront_alias_domains             = var.domain_names
  cloudfront_viewer_certificate_arn    = var.cloudfront_viewer_certificate_arn
  cloudfront_minimum_protocol_version  = var.cloudfront_minimum_protocol_version
  tags                                 = var.tags
  lambda_role_permissions_boundary     = var.lambda_role_permissions_boundary
  cloudfront_query_string              = var.cloudfront_query_string
  cloudfront_query_string_cache_keys   = var.cloudfront_query_string_cache_keys
  cloudfront_headers                   = var.cloudfront_headers
  cloudfront_cookies_forward           = var.cloudfront_cookies_forward
  cloudfront_cookies_whitelisted_names = var.cloudfront_cookies_whitelisted_names

  providers = {
    aws = aws.global_region
  }
}

################
# Custom Domains
################

data "aws_route53_zone" "alias_domains" {
  count = var.create_domain_name_records ? length(var.domain_zone_names) : 0

  name = var.domain_zone_names[count.index]
}

resource "aws_route53_record" "alias_domains" {
  count = var.create_domain_name_records ? length(var.domain_names) : 0

  zone_id = data.aws_route53_zone.alias_domains[count.index].zone_id
  name    = var.domain_names[count.index]
  type    = "A"

  alias {
    name                   = module.proxy.cloudfront_domain_name
    zone_id                = module.proxy.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}
