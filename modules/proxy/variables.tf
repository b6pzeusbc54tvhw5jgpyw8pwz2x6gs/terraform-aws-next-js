variable "name_prefix" {
  type = string
}

variable "name_suffix" {
  type = string
}

variable "ssr_server_domain_name" {
  type = string
}

variable "package_abs_path" {
  type = string
  default = ""
}

variable "static_bucket_access_identity" {
  type = string
}

variable "static_bucket_endpoint" {
  type = string
}

variable "cloudfront_price_class" {
  type = string
}

variable "enable_log" {
  type        = bool
  default     = false
}

variable "log_bucket_domain_name" {
  description = "s3 log bucket domain name"
  type        = string
  default     = null
}

variable "log_prefix_of_prefix" {
  description = "prefix of s3 log bucket prefix"
  type        = string
  default     = null
}

variable "log_include_cookies" {
  type        = bool
  default     = false
}


variable "proxy_config_json" {
  type = string
}

variable "proxy_config_ttl" {
  description = "time-to-live of proxy config in seconds."
  type = number
}

variable "proxy_config_version" {
  type = number

  validation {
    condition     = var.proxy_config_version > 0
    error_message = "Your tf-next package is outdated. Run `npm update tf-next@latest` or `yarn upgrade tf-next@latest`."
  }
}

variable "proxy_module_version" {
  type    = string
  default = "0.4.0"
}

variable "lambda_default_runtime" {
  type    = string
  default = "nodejs12.x"
}

variable "deployment_name" {
  type = string
}

variable "cloudfront_origins" {
  type    = list(any)
  default = null
}

variable "cloudfront_custom_behaviors" {
  type    = list(any)
  default = null
}

variable "cloudfront_alias_domains" {
  type    = list(string)
  default = []
}

variable "cloudfront_viewer_certificate_arn" {
  type    = string
  default = null
}

variable "cloudfront_minimum_protocol_version" {
  type = string
}

variable "cloudfront_cookies_forward" {
  type    = string
  default = "none"
}
variable "cloudfront_cookies_whitelisted_names" {
  type    = list(string)
  default = null
}
variable "cloudfront_query_string" {
  type    = bool
  default = false
}
variable "cloudfront_query_string_cache_keys" {
  type    = list(string)
  default = []
}
variable "cloudfront_headers" {
  type    = list(string)
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "lambda_role_permissions_boundary" {
  type    = string
  default = null
}
