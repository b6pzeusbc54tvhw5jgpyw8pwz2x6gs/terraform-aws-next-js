variable "name_prefix" {
  type = string
}

variable "name_suffix" {
  type = string
}

variable "build_id" {
  type = string
}

variable "static_files_archive" {
  type = string
}

variable "package_abs_path" {
  type = string
  default = ""
}

variable "deploy_trigger_module_version" {
  type    = string
  default = "0.2.0"
}

variable "expire_static_assets" {
  type = number
}

variable "use_manual_app_deploy" {
  description = "If true, Terraform apply doesn't upload static assetsc"
  type        = bool
}

variable "cloudfront_id" {
  description = "The ID of the CloudFront distribution where the route invalidations should be sent to."
  type        = string
}

variable "cloudfront_arn" {
  description = "The ARN of the CloudFront distribution where the route invalidations should be sent to."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "lambda_role_permissions_boundary" {
  type    = string
  default = null
}
