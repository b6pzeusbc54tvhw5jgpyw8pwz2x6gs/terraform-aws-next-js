locals {
  origin_id_static_deployment = "S3 Static Deployment"
}

data "aws_caller_identity" "current" {}

/*
// TODO: add create=boolean option into dealmore/download/npm
module "proxy_package" {
  source  = "dealmore/download/npm"
  version = "1.0.0"

  create         = var.package_abs_path != ""
  module_name    = "@dealmore/terraform-next-proxy"
  module_version = var.proxy_module_version
  path_to_file   = "dist.zip"
}
*/

#############
# Lambda@Edge
#############

resource "random_id" "function_name" {
  byte_length = 4
}

module "edge_proxy" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "1.34.0"

  lambda_at_edge = true

  function_name = "${var.name_prefix}-edge-proxy-${var.name_suffix}"
  description   = "Managed by Terraform-next.js"
  handler       = "handler.handler"
  runtime       = var.lambda_default_runtime
  role_permissions_boundary = var.lambda_role_permissions_boundary

  create_package         = false
  # local_existing_package = var.package_abs_path ? var.package_abs_path : module.proxy_package.abs_path
  local_existing_package = var.package_abs_path

  cloudwatch_logs_retention_in_days = 30

  tags          = var.tags
}

resource "aws_iam_role_policy" "lambda_edge_create_log_group" {
  name = "${var.name_prefix}-proxy-lambda-edge-additional-permission"
  role = module.edge_proxy.lambda_role_name
  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["logs:CreateLogGroup"],
        "Resource": [
          "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:*"
        ]
      }
    ]
  }
  EOF
}


############
# CloudFront
############
resource "aws_cloudfront_distribution" "distribution" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.name_prefix} ${var.deployment_name} - Main"
  price_class     = var.cloudfront_price_class
  aliases         = var.cloudfront_alias_domains
  default_root_object = "index"
  tags            = var.tags

  dynamic "logging_config" {
    for_each = var.enable_log ? [1] : []
    content {
      bucket          = var.log_bucket_domain_name
      prefix          = "${var.log_prefix_of_prefix}-cloudfront-proxy-main"
      include_cookies = var.log_include_cookies
    }
  }

  # Static deployment S3 bucket
  origin {
    domain_name = var.static_bucket_endpoint
    origin_id   = local.origin_id_static_deployment

    s3_origin_config {
      origin_access_identity = var.static_bucket_access_identity
    }

    custom_header {
      name  = "x-env-config-endpoint"
      value = "http://${var.proxy_config_endpoint}"
    }
    custom_header {
      name  = "x-env-config-ttl"
      value = var.proxy_config_ttl
    }
    custom_header {
      name  = "x-env-api-endpoint"
      value = var.ssr_server_domain_name
    }
  }

  # Custom origins
  dynamic "origin" {
    for_each = var.cloudfront_origins != null ? var.cloudfront_origins : []
    content {
      domain_name = origin.value["domain_name"]
      origin_id   = origin.value["origin_id"]

      dynamic "s3_origin_config" {
        for_each = lookup(origin.value, "s3_origin_config", null) != null ? [true] : []
        content {
          origin_access_identity = lookup(origin.value["s3_origin_config"], "origin_access_identity", null)
        }
      }

      dynamic "custom_origin_config" {
        for_each = lookup(origin.value, "custom_origin_config", null) != null ? [true] : []
        content {
          http_port                = lookup(origin.value["custom_origin_config"], "http_port", null)
          https_port               = lookup(origin.value["custom_origin_config"], "https_port", null)
          origin_protocol_policy   = lookup(origin.value["custom_origin_config"], "origin_protocol_policy", null)
          origin_ssl_protocols     = lookup(origin.value["custom_origin_config"], "origin_ssl_protocols", null)
          origin_keepalive_timeout = lookup(origin.value["custom_origin_config"], "origin_keepalive_timeout", null)
          origin_read_timeout      = lookup(origin.value["custom_origin_config"], "origin_read_timeout", null)
        }
      }
    }
  }

  # Lambda@Edge Proxy
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.origin_id_static_deployment
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 3600

    forwarded_values {
      query_string              = var.cloudfront_query_string
      query_string_cache_keys   = var.cloudfront_query_string_cache_keys
      cookies {
        forward           = var.cloudfront_cookies_forward
        whitelisted_names = var.cloudfront_cookies_whitelisted_names
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = module.edge_proxy.this_lambda_function_qualified_arn
      include_body = false
    }
  }

  # Next.js static assets
  ordered_cache_behavior {
    path_pattern     = "/static/*"  # /static/${buildId}/_next/static/*
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.origin_id_static_deployment

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
  }

  # Custom behaviors
  dynamic "ordered_cache_behavior" {
    for_each = var.cloudfront_custom_behaviors != null ? var.cloudfront_custom_behaviors : []
    content {
      path_pattern     = ordered_cache_behavior.value["path_pattern"]
      allowed_methods  = ordered_cache_behavior.value["allowed_methods"]
      cached_methods   = ordered_cache_behavior.value["cached_methods"]
      target_origin_id = ordered_cache_behavior.value["target_origin_id"]

      compress               = ordered_cache_behavior.value["compress"]
      viewer_protocol_policy = ordered_cache_behavior.value["viewer_protocol_policy"]

      origin_request_policy_id = ordered_cache_behavior.value["origin_request_policy_id"]
      cache_policy_id          = ordered_cache_behavior.value["cache_policy_id"]
    }
  }

  # Custom legacy behaviors
  dynamic "ordered_cache_behavior" {
    for_each = var.cloudfront_custom_legacy_behaviors!= null ? var.cloudfront_custom_legacy_behaviors : []
    content {
      path_pattern     = ordered_cache_behavior.value["path_pattern"]
      allowed_methods  = ordered_cache_behavior.value["allowed_methods"]
      cached_methods   = ordered_cache_behavior.value["cached_methods"]
      target_origin_id = ordered_cache_behavior.value["target_origin_id"]

      min_ttl                = ordered_cache_behavior.value["min_ttl"]
      default_ttl            = ordered_cache_behavior.value["default_ttl"]
      max_ttl                = ordered_cache_behavior.value["max_ttl"]
      compress               = ordered_cache_behavior.value["compress"]
      viewer_protocol_policy = ordered_cache_behavior.value["viewer_protocol_policy"]

      dynamic "forwarded_values" {
        for_each = lookup(ordered_cache_behavior.value, "forwarded_values", null) != null ? [true] : []
        content {
          query_string = lookup(ordered_cache_behavior.value["forwarded_values"], "query_string", null)
          cookies {
            forward = lookup(lookup(ordered_cache_behavior.value["forwarded_values"], "cookies", null), "forward", null)
          }
        }
      }
    }
  }

  # Custom error response when a doc is not found in S3 (returns 403)
  # Then shows the 404 page
  custom_error_response {
    error_caching_min_ttl = 60
    error_code            = 403
    response_code         = 404
    # We can't chnage it like `/{buildId}/404` for everytime build,
    # /404 file must be copied to `/404` path from `/${buildId}/404`
    response_page_path    = "/404"
  }

  custom_error_response {
    error_caching_min_ttl = 60
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500"
  }

  viewer_certificate {
    cloudfront_default_certificate = var.cloudfront_viewer_certificate_arn != null ? false : true
    acm_certificate_arn            = var.cloudfront_viewer_certificate_arn
    ssl_support_method             = var.cloudfront_viewer_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.cloudfront_viewer_certificate_arn != null ? var.cloudfront_minimum_protocol_version : null
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

