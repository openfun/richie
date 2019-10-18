
variable "aws_region" {
  type    = "string"
  default = "eu-west-1"
}

variable "cloudfront_price_class" {
  type = "map"

  default = {
    production = "PriceClass_All"
  }
}
