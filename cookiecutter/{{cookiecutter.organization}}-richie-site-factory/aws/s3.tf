# Create S3 Bucket for media files
resource "aws_s3_bucket" "richie_media" {
  bucket = "${terraform.workspace}-${var.site}-{{cookiecutter.organization}}-richie-media"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }

  versioning {
    enabled = var.media_expiration > 0 ? false : true
  }

  dynamic "lifecycle_rule" {
    for_each = var.media_expiration > 0 ? [1] : []
    content {
      id      = "expiration"
      enabled = true
      expiration {
        days = var.media_expiration
      }
    }
  }

  tags = {
    Name        = "${var.site}-media"
    Environment = "${terraform.workspace}"
  }
}

# Defines a user that should be able to write to the S3 bucket
resource "aws_iam_user" "richie_user" {
  name = "${terraform.workspace}-${var.site}-{{cookiecutter.organization}}-richie"
}

resource "aws_iam_access_key" "richie_access_key" {
  user = aws_iam_user.richie_user.name
}

# Grant accesses to the media bucket:
# - full access for the user,
# - read only access for CloudFront.
resource "aws_s3_bucket_policy" "richie_media_bucket_policy" {
  bucket = aws_s3_bucket.richie_media.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "User access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_iam_user.richie_user.arn}"
      },
      "Action": [ "s3:*" ],
      "Resource": [
        "${aws_s3_bucket.richie_media.arn}",
        "${aws_s3_bucket.richie_media.arn}/*"
      ]
    },
    {
      "Sid": "Cloudfront",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.richie_oai.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.richie_media.arn}/*"
    }
  ]
}
EOF
}
