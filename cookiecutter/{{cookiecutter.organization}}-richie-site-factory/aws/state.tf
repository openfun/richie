terraform {
  backend "s3" {
    encrypt = true
    bucket = "{{cookiecutter.organization}}-richie-site-factory-terraform"
    dynamodb_table = "{{cookiecutter.organization}}-richie_site_factory_terraform_state_locks"
  }
}

terraform {
  required_providers {
    aws = "~> 2.70"
  }
}
