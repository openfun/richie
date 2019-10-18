
terraform {
  backend "s3" {
    key            = "{{cookiecutter.module_name}}.tfstate"
    bucket         = "{{cookiecutter.module_name}}-terraform"
    dynamodb_table = "{{cookiecutter.module_name}}_terraform_state_locks"
    encrypt        = true
  }
}
