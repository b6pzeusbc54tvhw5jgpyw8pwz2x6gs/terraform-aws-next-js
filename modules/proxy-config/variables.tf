variable "name_prefix" {
  type = string
}

variable "cloudfront_price_class" {
  type = string
}

variable "proxy_config_json" {
  type = string
}

variable "deployment_name" {
  type = string
}

variable "log_bucket_domain_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "use_manual_upload" {
  type    = bool
}