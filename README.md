# Richie, a FUN CMS for Open edX

[![Greenkeeper badge](https://badges.greenkeeper.io/openfun/richie.svg)](https://greenkeeper.io/)

[![CircleCI](https://circleci.com/gh/openfun/richie/tree/master.svg?style=svg)](https://circleci.com/gh/openfun/richie/tree/master)

## Overview

`Open edX` is a great tool for authoring (**Studio**), hosting and playing (**LMS**) interactive
online courses and MOOCs.

However, if you need to build a complete website with flexible content to aggregate your courses,
in several languages and from different sources, **you will soon need a CMS**.

For example, the [edx.org](https://www.edx.org) website is built on `Drupal` for content pages and
on [edX course discovery](https://github.com/edx/course-discovery) for the catalog.

At "France Université Numérique", we wanted to build a similar portal but with `Python` and
`Django`. That's why we built `Richie` on top of [DjangoCMS](https://www.django-cms.org), one of
the best CMS on the market, as a toolbox to easily create full fledged websites with a catalog of
online courses.

Among the features that `Richie` offers out of the box:

- multi-site and multi-lingual by default,
- advanced access rights and moderation,
- catalog of courses synchronized with one or more `Open edX` instances,
- search engine based on `Elasticsearch` and pre-configured to offer full-text queries,
  multi-facetting, auto-complete,...
- flexible custom pages for courses, organizations, subjects, teachers (and their inter-relations),
- Extensible with any third-party `DjangoCMS` plugin or any third-party `Django` application.


## Architecture

`Richie` is a **container-native application** but can also be installed
[on your machine](./docs/native_installation.md).

For development, the project is defined using a [docker-compose file](../docker-compose.yml) and
consists of 4 services:

- **db**: the `Postgresql` database,
- **elasticsearch**: the search engine,
- **app**: the actual `DjangoCMS` project with all our application code,
- **node**: used for front-end related tasks, _i.e._ transpiling `TypeScript` sources, bundling
  them into a JS package, and building the CSS files from Sass sources.

We provide alternative `Docker Compose` configurations for test, CI and production, but the
application can also be run with your favorite orchestrator. At "France Université Numérique", we
deploy our applications on `OpenShift` using [`Arnold`](https://github.com/openfun/arnold).


## Getting started

First, make sure you have a recent version of Docker and
[Docker Compose](https://docs.docker.com/compose/install) installed on your laptop:

```bash
$ docker -v
  Docker version 1.13.1, build 092cba3

$ docker-compose --version
  docker-compose version 1.17.1, build 6d101fb
```

⚠️ You may need to run the following commands with `sudo` but this can be avoided by assigning your
user to the `docker` group.

The easiest way to start working on the project is to use our `Makefile`:

    $ make bootstrap

This command builds the `app` container, installs front-end and back-end dependencies, builds the
front-end application and styles, and performs database migrations. It's a good idea to use this
command each time you are pulling code from the project repository to avoid dependency-related or
migration-related issues.

Now that your `Docker` services are ready to be used, start the full CMS by running:

    $ make run

You should be able to view the site at [localhost:8070](http://localhost:8070)

Once the CMS is up and running, you can create a superuser account:

    $ make superuser

You can create a basic demo site by running:

    $ make demo-site

Note that if you don't create the demo site and start from a blank CMS, you will get some errors
requesting you to create some required root pages. So it is easier as a first approach to test the
CMS with the demo site.


## Contributing

This project is intended to be community-driven, so please, do not hesitate to get in touch if you
have any question related to our implementation or design decisions.

We try to raise our code quality standards and expect contributors to follow the recommandations
from our [handbook](https://openfun.gitbooks.io/handbook/content).


### Checking your code

We use strict flake8, pylint and black linters to check the validity of our backend code:

    $ make lint-back

We use strict tslint and prettier to check the validity of our frontend code:

    $ make lint-front


### Running tests

On the backend, we use pytest to run our test suite:

    $ make test-back

On the frontend, we use karma to run our test suite:

    $ make test-front


### Running migrations

The first time you start the project with `make bootstrap`, the `db` container automatically
creates a fresh database named `richie` and performs database migrations. Each time a new
**database migration** is added to the code, you can synchronize the database schema by running:

    $ make migrate


### Handling new dependencies

Each time you add new front-end or back-end dependencies, you will need to rebuild the
application. We recommend to use:

    $ make bootstrap


### To go further

To see all available commands, run:

    $ make

See our [tips and tricks](./docs/docker_development.md) for development with Docker


## License

This work is released under the MIT License (see [LICENSE](./LICENSE)).
