output "cloudfront_domain" {
  value = "${aws_cloudfront_distribution.richie_cloudfront_distribution.domain_name}"
}

output "iam_access_key" {
  value = "${aws_iam_access_key.richie_access_key.id}"
}

output "iam_access_secret" {
  value = "${aws_iam_access_key.richie_access_key.secret}"
}
