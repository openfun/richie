# Statics and media files management with AWS

We use AWS S3/CloudFront to store and distribute static and media files for the
project in various environments. Buckets, distributions and IAM users creation
is fully automated using [Terraform](https://www.terraform.io/).

> ✋ If you plan to develop locally on the project, you don't have to configure
> anything more. The following documentation targets operational users willing
> to setup an AWS infrastructure to handle static and media files.

## AWS Credentials

To bootstrap the AWS infrastructure, you will first need to edit the `env.d/aws`
environment file with your AWS credentials and settings. You can start by
copying the `env.d/aws.dist` template _via_ the `make aws/env.d` command. Now
edit this new file with your AWS secrets:

```
# env.d/aws
#
# AWS admin credentials
AWS_ACCESS_KEY_ID=yourAwsAccesKeyId
AWS_SECRET_ACCESS_KEY=YourAwsSecretAccessKey
AWS_DEFAULT_REGION=eu-west-1

# Terraform variables
TF_VAR_aws_region=eu-west-1
```

> ✋ Note that these credentials should have sufficient access rights to create:
> i. S3 buckets, ii. KMS keys, iii. DynamoDB tables, iv. IAM users and v.
> CloudFront distributions.

## Setup a shared Terraform state

> ✋ If the project already exists with a shared state, you can skip this section
> and start fetching the state locally to create new workspaces.

If the project doesn't exist at all, you will need to create an S3 bucket (and a
DynamoDB lock table) to store your Terraform state file (and its locking) by
typing the following commands in your terminal:

```
$ bin/state init
$ bin/state apply
```

And voilà! Your shared state is now available to anyone contributing to the
project.

## Create new environments

If everything went smoothly, it's time to initialize your main terraform project
using the shared state:

```
$ bin/terraform init
```

Now that your terraform project is initialized, you will be able to create S3
buckets for static and media files in various environments (see the [project's
settings](../src/backend/{{cookiecutter.module_name}}/settings.py)). To achieve this, we will use
Terraform workspaces with the following paradigm:

_One workspace should be dedicated to one environment_.

You can list existing workspaces _via_:

```
$ bin/terraform workspace list
```

By default, only the `default` workspace exists and is active. You can create a
new one for the `staging` environment _via_:

```
$ bin/terraform workspace new staging
```

Once created and active, we will use this workspace to create `staging` S3
buckets, IAM user and CloudFront distributions:

```
$ bin/terraform apply
```

All created objects should be namespaced with the current active workspace
(_e.g._ `staging`). You can check this once logged in to your AWS console.

To create the same objects for a different `environment` (_e.g._ `feature`,
`preprod`, or `production`), you should follow the same procedure:

```
$ bin/terraform workspace (new|select) [environment]
$ bin/terraform apply
```

_nota bene_: in the previous pattern, we use the `workspace` `new` or `select`
subcommand depending on the workspace availability.

## Configure runtime environment

Once your buckets have been created for a targeted environment, you will need to
configure your project's runtime environment with the secrets allowing your
Django application to access to those buckets and CloudFront distributions. The
following environment variables should be defined:

- `DJANGO_AWS_CLOUDFRONT_DOMAIN`
- `DJANGO_AWS_ACCESS_KEY_ID`
- `DJANGO_AWS_SECRET_ACCESS_KEY`

Corresponding values can be obtained using the following Terraform command:

```
$ bin/terraform output
```

The output should look like the following:

```
cloudfront_domain = xxxxxxxxxxxxx.cloudfront.net
iam_access_key = XXXXXXXXXXXXXXXXXXXX
iam_access_secret = XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Note that the command output is conditioned by the active workspace, beware to
select the expected workspace (_aka_ environment) first (see previous section).
