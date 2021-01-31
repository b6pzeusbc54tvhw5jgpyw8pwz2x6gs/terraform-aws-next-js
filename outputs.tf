output "static_upload_bucket_id" {
  value = module.statics_deploy.static_upload_bucket_id
}

output "cloudfront_domain_name" {
  description = "The domain of the main CloudFront distribution."
  value       = module.proxy.cloudfront_domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "The zone id of the main CloudFront distribution."
  value       = module.proxy.cloudfront_hosted_zone_id
}

output "proxy_config_s3_bucket" {
  value = module.proxy.proxy_config_s3_bucket
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}

output "apigw_api_id" {
  value = module.api_gateway.this_apigatewayv2_api_id
}

output "apigw_api_execution_arn" {
  value = module.api_gateway.this_apigatewayv2_api_execution_arn
}
