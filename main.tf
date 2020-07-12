provider "aws" {
  alias = "global"
}

locals {
  # Lambda default config
  lambda_default_runtime = "nodejs12.x"
  lambda_default_memory  = 1024
  lambda_default_timeout = 10

  # next-tf config
  config_dir           = trimsuffix(var.next_tf_dir, "/")
  config_file          = jsondecode(file("${local.config_dir}/config.json"))
  lambdas              = lookup(local.config_file, "lambdas", {})
  static_files_archive = "${local.config_dir}/${lookup(local.config_file, "staticFilesArchive", "")}"

  routes_json = lookup(local.config_file, "routes", [])
  lambda_routes_json = flatten([
    for integration_key, integration in local.lambdas : [
      "${lookup(integration, "route", "/")}"
    ]
  ])
  proxy_config_json = jsonencode({
    routes       = local.routes_json
    lambdaRoutes = local.lambda_routes_json
  })
}

# Generates for each function a unique function name
resource "random_id" "function_name" {
  for_each = local.lambdas

  prefix      = "${each.key}-"
  byte_length = 4
}

##########
# IAM role
##########

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  for_each = local.lambdas

  name        = random_id.function_name[each.key].hex
  description = "Managed by Terraform-next.js"

  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

#########
# Lambdas
#########

# Static deployment to S3 website
module "statics_deploy" {
  source = "./modules/statics-deploy"

  static_files_archive     = local.static_files_archive
  debug_use_local_packages = var.debug_use_local_packages
}

# Cloudwatch Logs
resource "aws_cloudwatch_log_group" "this" {
  for_each = local.lambdas

  name              = "/aws/lambda/${random_id.function_name[each.key].hex}"
  retention_in_days = 14
}

resource "random_id" "iam_name" {
  prefix      = "terraform_next_lambda_logging-"
  byte_length = 4
}

resource "aws_iam_policy" "lambda_logging" {
  name        = random_id.iam_name.hex
  path        = "/"
  description = "IAM policy for logging from a Terraform-next.js"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  for_each = local.lambdas

  role       = random_id.function_name[each.key].hex
  policy_arn = aws_iam_policy.lambda_logging.arn
}

# Lambda

resource "aws_lambda_function" "this" {
  for_each = local.lambdas

  function_name = random_id.function_name[each.key].hex
  description   = "Managed by Terraform-next.js"
  role          = aws_iam_role.lambda[each.key].arn
  handler       = lookup(each.value, "handler", "")
  runtime       = lookup(each.value, "runtime", local.lambda_default_runtime)
  memory_size   = lookup(each.value, "memory", local.lambda_default_memory)
  timeout       = local.lambda_default_timeout

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
  for_each = local.lambdas

  statement_id  = "AllowInvokeFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = random_id.function_name[each.key].hex
  principal     = "apigateway.amazonaws.com"

  source_arn = "${module.api_gateway.this_apigatewayv2_api_execution_arn}/*/*/*"
}

#############
# Api-Gateway
#############

locals {
  integrations_keys = flatten([
    for integration_key, integration in local.lambdas : [
      "ANY ${lookup(integration, "route", "/")}/{proxy+}"
    ]
  ])
  integration_values = flatten([
    for integration_key, integration in local.lambdas : {
      lambda_arn             = aws_lambda_function.this[integration_key].arn
      payload_format_version = "1.0"
      timeout_milliseconds   = local.lambda_default_timeout * 1000
    }
  ])
  integrations = zipmap(local.integrations_keys, local.integration_values)
}

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 0.2.0"

  name          = var.deployment_name
  description   = "Managed by Terraform-next.js"
  protocol_type = "HTTP"

  create_api_domain_name = false

  integrations = local.integrations
}

#######
# Proxy
#######

module "proxy" {
  source = "./modules/proxy"

  api_gateway_endpoint          = trimprefix(module.api_gateway.this_apigatewayv2_api_api_endpoint, "https://")
  static_bucket_endpoint        = module.statics_deploy.static_bucket_endpoint
  static_bucket_access_identity = module.statics_deploy.static_bucket_access_identity
  proxy_config_json             = local.proxy_config_json
  lambda_default_runtime        = local.lambda_default_runtime

  # Forwarding variables
  deployment_name                   = var.deployment_name
  cloudfront_origins                = var.cloudfront_origins
  cloudfront_custom_behaviors       = var.cloudfront_custom_behaviors
  cloudfront_alias_domains          = var.domain_names
  cloudfront_viewer_certificate_arn = var.cloudfront_viewer_certificate_arn
  debug_use_local_packages          = var.debug_use_local_packages

  providers = {
    aws = aws.global
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
    name                   = module.proxy.distribution_domain_name
    zone_id                = module.proxy.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}
