---
id: version-2.0.0-quick-start
title: Getting started with Richie
sidebar_label: Quick start
original_id: quick-start
---

If you're just looking for a quick preview of `Richie`, you can take a look and have a tour of `Richie` on our dedicated [demo site](https://demo.richie.education).

Login/password are `admin`/`admin`. The database is regularly flushed.

## Architecture

`Richie` is a **container-native application** but can also be installed
[on your machine](native-installation.md).

For development, the project is defined using a [docker-compose file](../docker-compose.yml) and
consists of 4 services:

- **db**: the `Postgresql` database,
- **elasticsearch**: the search engine,
- **app**: the actual `DjangoCMS` project with all our application code,
- **node**: used for front-end related tasks, _i.e._ transpiling `TypeScript` sources, bundling
  them into a JS package, and building the CSS files from Sass sources.

At "France Université Numérique", we deploy our applications on `OpenShift`/`Kubernetes` using
[`Arnold`](https://github.com/openfun/arnold).

## Getting started

### Docker

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

### Project bootstrap

The easiest way to start working on the project is to use our `Makefile`:

    $ make bootstrap

This command builds the `app` container, installs front-end and back-end dependencies, builds the
front-end application and styles, and performs database migrations. It's a good idea to use this
command each time you are pulling code from the project repository to avoid dependency-related or
migration-related issues.

Now that your `Docker` services are ready to be used, start the full CMS by running:

    $ make run

### Adding content

Once the CMS is up and running, you can create a superuser account:

    $ make superuser

You can create a basic demo site by running:

    $ make demo-site

Note that if you don't create the demo site and start from a blank CMS, you will get some errors
requesting you to create some required root pages. So it is easier as a first approach to test the
CMS with the demo site.

You should be able to view the site at [localhost:8070](http://localhost:8070)

### Basic - Connecting Richie to OpenEdx

This project is pre-configured to connect with an OpenEdx instance started with
[OpenEdx Docker](https://github.com/openfun/openedx-docker], which provides a ready to use
docker-compose stack of OpenEdx in several flavors. Head over to
[OpenEdx Docker README](https://github.com/openfun/openedx-docker#readme) for instructions on how
to bootstrap an instance.

Just start apps with `make run`.

Richie should respond on `http://localhost:8070` and OpenEdx on `http://localhost:8073`.

### Advanced - Connecting Richie to OpenEdx

If you want users to enroll on courses in OpenEdx directly from Richie via API calls, you should
read [the advanced guide](lms-connection.md#connecting-richie-and-openedx-over-tls) to connect
Richie to OpenEdx over TLS.
