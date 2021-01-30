locals {
  s3_origin_id         = "S3-Proxy-Config-${aws_s3_bucket.proxy_config.id}"
  proxy_config_key     = "proxy-config.json"
  proxy_config_max_age = 15 * 60
}

########
# Bucket
########

resource "aws_s3_bucket" "proxy_config" {
  bucket_prefix = "next-tf-proxy-config"
  acl           = "private"
  force_destroy = true
  tags          = var.tags
}

data "aws_iam_policy_document" "cf_access" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.proxy_config.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [module.proxy_config_cf.this_cloudfront_origin_access_identity_iam_arns[0]]
    }
  }
}

resource "aws_s3_bucket_policy" "origin_access" {
  bucket = aws_s3_bucket.proxy_config.id
  policy = data.aws_iam_policy_document.cf_access.json
}

#####################
# Upload Proxy Config
#####################

resource "aws_s3_bucket_object" "proxy_config" {
  bucket        = aws_s3_bucket.proxy_config.id
  key           = local.proxy_config_key
  content       = var.proxy_config_json
  content_type  = "application/json"
  cache_control = "max-age=${local.proxy_config_max_age}"
  tags          = var.tags

  etag = md5(var.proxy_config_json)
}

############
# CloudFront
############

module "proxy_config_cf" {
  source = "terraform-aws-modules/cloudfront/aws"

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.name_prefix} ${var.deployment_name} - Proxy-Config"
  price_class         = var.cloudfront_price_class
  tags                = var.tags

  retain_on_delete    = false
  wait_for_deployment = true

  create_origin_access_identity = true
  origin_access_identities = {
    proxy_config_s3 = "s3 access identity for proxy config cloudfront"
  }

  origin = {
    proxy_config_s3 = {
      origin_id   = local.s3_origin_id
      domain_name = aws_s3_bucket.proxy_config.bucket_regional_domain_name
      s3_origin_config = {
        origin_access_identity = "proxy_config_s3"
      }
    }
  }

  default_cache_behavior = {
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "allow-all"
    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]
    min_ttl         = 0
    default_ttl     = 0
    max_ttl         = 3600
    query_string    = false
    cookies_forward = "none"
  }
}
