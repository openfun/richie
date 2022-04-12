
variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "site" {
  type = string
}

variable "cloudfront_price_class" {
  type = map

  default = {
    production = "PriceClass_All"
  }
}

variable "app_domain" {
  type = map
}

variable "media_expiration" {
  type = number
  default = 0
}
