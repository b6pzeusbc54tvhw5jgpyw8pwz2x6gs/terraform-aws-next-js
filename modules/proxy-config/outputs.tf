output "config_endpoint" {
  value = "${module.proxy_config_cf.this_cloudfront_distribution_domain_name}/${local.proxy_config_key}"
}
