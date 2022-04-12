output "state_kms_key" {
  value = "${aws_kms_key.state_key.arn}"
}

output "state_bucket" {
  value = "${aws_s3_bucket.state_bucket.id}"
}

output "state_locks" {
  value = "${aws_dynamodb_table.terraform-state-locks.id}"
}
