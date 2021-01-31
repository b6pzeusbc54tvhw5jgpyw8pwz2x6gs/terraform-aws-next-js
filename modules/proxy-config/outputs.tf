output "config_endpoint" {
  value = "${module.proxy_config_cf.this_cloudfront_distribution_domain_name}/${local.proxy_config_key}"
}

output "config_s3_bucket" {
  value = aws_s3_bucket.proxy_config.id
}
