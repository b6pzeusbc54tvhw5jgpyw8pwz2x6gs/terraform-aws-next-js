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
  value = module.proxy_config.config_s3_bucket
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

output "aws_credential_for_cicd" {
  value = <<EOT
export AWS_ACCESS_KEY_ID=${aws_iam_access_key.cicd.id}
export AWS_SECRET_ACCESS_KEY=<use-below-encrypted-key-after-decrypted>

encrypted key:
${aws_iam_access_key.cicd.encrypted_secret}
EOT
}

output "deployment_environments" {
  value = <<EOT
export TFNEXT_STATIC_UPLOAD_BUCKET=${module.statics_deploy.static_upload_bucket_id}
export TFNEXT_STATIC_DEPLOY_BUCKET=${module.statics_deploy.static_deploy_bucket_id}
export TFNEXT_PROXY_CONFIG_BUCKET=${module.proxy_config.config_s3_bucket}
export TFNEXT_LAMBDA_ROLE_ARN=${aws_iam_role.lambda.arn}
export TFNEXT_APIGW_API_EXECUTION_ARN=${module.api_gateway.this_apigatewayv2_api_execution_arn}
export TFNEXT_APIGW_API_ID=${module.api_gateway.this_apigatewayv2_api_id}
EOT
}
