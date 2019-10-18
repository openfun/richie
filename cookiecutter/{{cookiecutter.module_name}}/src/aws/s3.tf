# Create S3 Bucket for static files
resource "aws_s3_bucket" "{{cookiecutter.module_name}}_static" {
  bucket = "${terraform.workspace}-{{cookiecutter.module_name}}-static"
  acl    = "private"
  region = "${var.aws_region}"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  tags {
    Name        = "{{cookiecutter.module_name}}-static"
    Environment = "${terraform.workspace}"
  }
}

# Create S3 Bucket for media files
resource "aws_s3_bucket" "{{cookiecutter.module_name}}_media" {
  bucket = "${terraform.workspace}-{{cookiecutter.module_name}}-media"
  acl    = "private"
  region = "${var.aws_region}"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  versioning {
    enabled = true
  }

  tags {
    Name        = "{{cookiecutter.module_name}}-media"
    Environment = "${terraform.workspace}"
  }
}

# Defines a user that should be able to write to both S3 buckets
resource "aws_iam_user" "{{cookiecutter.module_name}}_user" {
  name = "${terraform.workspace}-{{cookiecutter.module_name}}"
}

resource "aws_iam_access_key" "{{cookiecutter.module_name}}_access_key" {
  user = "${aws_iam_user.{{cookiecutter.module_name}}_user.name}"
}

# Grant accesses to the static bucket:
# - full access for the user,
# - read only access for CloudFront.
resource "aws_s3_bucket_policy" "{{cookiecutter.module_name}}_static_bucket_policy" {
  bucket = "${aws_s3_bucket.{{cookiecutter.module_name}}_static.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_user.{{cookiecutter.module_name}}_user.arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.{{cookiecutter.module_name}}_static.arn}",
        "${aws_s3_bucket.{{cookiecutter.module_name}}_static.arn}/*"
      ]
    },
    {
      "Sid": "Cloudfront",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.{{cookiecutter.module_name}}_oai.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.{{cookiecutter.module_name}}_static.arn}/*"
    }
  ]
}
EOF
}

# Grant accesses to the media bucket:
# - full access for the user,
# - read only access for CloudFront.
resource "aws_s3_bucket_policy" "{{cookiecutter.module_name}}_media_bucket_policy" {
  bucket = "${aws_s3_bucket.{{cookiecutter.module_name}}_media.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_user.{{cookiecutter.module_name}}_user.arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.{{cookiecutter.module_name}}_media.arn}",
        "${aws_s3_bucket.{{cookiecutter.module_name}}_media.arn}/*"
      ]
    },
    {
      "Sid": "Cloudfront",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.{{cookiecutter.module_name}}_oai.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.{{cookiecutter.module_name}}_media.arn}/*"
    }
  ]
}
EOF
}
