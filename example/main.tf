terraform {
  required_version = "~> 0.14.5"
  backend "s3" {}
}

provider "aws" {
  region = "eu-west-1"
}

provider "aws" {
  alias = "virginia"
  region = "us-east-1"
}

locals {
  name_prefix = lookup(jsondecode(file("package.json")),"name","tfnext")
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "log" {
  bucket = "${local.name_prefix}-log-${random_id.suffix.hex}"
  acl    = "log-delivery-write"
}

module "tf-next" {
  # source               = "github.com/b6pzeusbc54tvhw5jgpyw8pwz2x6gs/terraform-aws-next-js"
  name_prefix            = local.name_prefix
  name_suffix            = random_id.suffix.hex
  cloudfront_price_class = "PriceClass_All"

  enable_log             = true
  log_bucket_domain_name = aws_s3_bucket.log.bucket_domain_name
  log_prefix_of_prefix   = "${local.name_prefix}-log"
  log_include_cookies    = false

  # for local test
  source = "../"
  static_deploy_package_abs_path = abspath("../packages/deploy-trigger/dist.zip")
  proxy_package_abs_path         = abspath("../packages/proxy/dist.zip")

  cloudfront_query_string              = true
  cloudfront_query_string_cache_keys   = null
  cloudfront_headers                   = null
  cloudfront_cookies_forward           = "whitelist"
  cloudfront_cookies_whitelisted_names = ["locale"]

  # If you want seperated application CI/CD solution,
  # you can use `use_manual_app_deploy: true`
  # Notice:
  # first `true` setting removes already auto uploaded
  # proxy-config, static assets, lambda, lambda-permission, api-gateway integrations.
  use_manual_app_deploy                = true
}

output "domain" {
  value = module.tf-next.cloudfront_domain_name
}

output "deployment_environments" {
  value = module.tf-next.deployment_environments
}
output "aws_credential_for_cicd" {
  value = module.tf-next.aws_credential_for_cicd
}
