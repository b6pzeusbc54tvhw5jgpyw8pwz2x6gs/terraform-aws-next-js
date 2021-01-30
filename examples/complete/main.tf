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

module "tf-next" {
  # source               = "github.com/b6pzeusbc54tvhw5jgpyw8pwz2x6gs/terraform-aws-next-js"
  name_prefix            = lookup(jsondecode(file("package.json")),"name","tfnext-app")
  cloudfront_price_class = "PriceClass_All"

  # for local test
  source = "../../"
  static_deploy_package_abs_path = abspath("../../packages/deploy-trigger/dist.zip")
  proxy_package_abs_path         = abspath("../../packages/proxy/dist.zip")

  cloudfront_query_string              = true
  cloudfront_query_string_cache_keys   = null
  cloudfront_headers                   = null
  cloudfront_cookies_forward           = "whitelist"
  cloudfront_cookies_whitelisted_names = ["locale"]
}

output "domain" {
  value = module.tf-next.cloudfront_domain_name
}
