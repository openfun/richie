resource "aws_kms_key" "state_key" {
  description = "Used by Terraform to store remote state for a themed richie site"
}

resource "aws_s3_bucket" "state_bucket" {
  bucket = "{{cookiecutter.organization}}-richie-site-factory-terraform"
  acl    = "private"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.state_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  tags = {
    Name = "terraform"
  }
}
