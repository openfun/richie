output "cloudfront_domain" {
  value = "${aws_cloudfront_distribution.{{cookiecutter.module_name}}_cloudfront_distribution.domain_name}"
}

output "iam_access_key" {
  value = "${aws_iam_access_key.{{cookiecutter.module_name}}_access_key.id}"
}

output "iam_access_secret" {
  value = "${aws_iam_access_key.{{cookiecutter.module_name}}_access_key.secret}"
}
