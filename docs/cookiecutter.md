# Starting a portal project based on Richie with Cookiecutter

We use [Cookiecutter](https://github.com/audreyr/cookiecutter) to help you
set-up a production-ready learning portal website based on
[Richie](https://github.com/openfun/richie) in seconds.

## Run Cookiecutter

First, we need to run Cookiecutter against our
[Cookiecutter template](../cookiecutter):

```bash
make start-project
```

### Configure

You will be prompted to enter a bunch of project config values (name,
description...). This info will be used to bootstrap your new project.

For example, if you want to call your project "learning lab":

```bash
project_name [Learning portal]: Learning Lab
module_name [learninglab]: learning_lab  # must be a valid Python module name
description [A learning portal using richie.]: An Open Education lab.
```

Then, Cookiecutter will generate your project from the template, using the
values that you entered. It will be placed at the same level as the current
richie directory.

In the example above the new project will be placed in a new directory called
"learninglab".

### Bootstrap your project

Go to the newly created project and bootstrap the application:

```bash
cd ../learninglab
make bootstrap
```

Once the bootstrap phase is finished, you should be able to view the site at
[localhost:8080](http://localhost:8080).

The README of the generated project contains more information about how to
configure and run the application.

## Help us improve this project generator

After starting your project, please submit an issue let us know how it went and
what additional variables we should add to make it better.
