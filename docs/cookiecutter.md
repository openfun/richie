# Starting a portal project based on Richie with Cookiecutter

We use [Cookiecutter](https://github.com/audreyr/cookiecutter) to help you
set up a production-ready learning portal website based on
[Richie](https://github.com/openfun/richie) in seconds.

## Install Cookiecutter

First, you need to [install cookiecutter on your machine][1].

## Run Cookiecutter

Run Cookiecutter against our [Cookiecutter template](../cookiecutter):

```bash
$ cookiecutter gh:openfun/richie --directory cookiecutter
> organization: foo
```

You will be prompted to enter an organization name, which will determine the
name of your repository. For example, if you choose "foo" as organization
name, your repository will be named `foo-richie-site-factory`. It's
nice if you keep it that way so all richie site factories follow this
convention.

When you confirm the organization name, Cookiecutter will generate your
project from the Cookiecutter template and place it at the level where you
currently are.

### Bootstrap your project

Enter the newly created project and add a new site to your site factory:

```bash
$ cd ../foo-richie-site-factory
$ make add-site
> site: bar
```

This script also uses Cookiecutter against our site template located in the
(../cookiecutter/{{cookiecutter.organization}}-richie-site-factory/template)
directory.

Once your new site is created, activate it:

```bash
$ bin/activate
```

Now bootstrap the site to build its docker image, create its media folder,
database, etc.:

```bash
$ make bootstrap
```

Once the bootstrap phase is finished, you should be able to view the site at
[localhost:8070](http://localhost:8070).

You can create a full fledge demo site by running:

```bash
$ make demo-site
```

Note that the README of your newly created site factory contains detailed
information about how to configure and run a site.

## Update your Richie site factory

If we later improve our scripts, you will be able to update your own site
factory by replaying Cookiecutter. This will override your files in the
project's scaffolding but, don't worry, it will respect all the sites you
will have created in the `sites` directory.

## Help us improve this project

After starting your project, please submit an issue let us know how it went and
what other features we should add to make it better.

[1]: https://cookiecutter.readthedocs.io/en/latest/installation.html
