---
id: installation
title: Installing Richie for development
sidebar_label: Installation
---

`Richie` is a **container-native application** but can also be installed
[on your machine](native-installation.md).

For development, the project is defined using a
[docker-compose file](../docker-compose.yml) and consists of:

- 3 running services:
    - **database**: `postgresql` or `mysql` at your preference,
    - **elasticsearch**: the search engine,
    - **app**: the actual `DjangoCMS` project with all our application code.

- 2 containers for building purposes:

    - **node**: used for front-end related tasks, _i.e._ transpiling
    `TypeScript` sources, bundling them into a JS package, and building the
    CSS files from Sass sources,
    - **crowdin**: used to upload and retrieve i18n files to and from the
    [Crowding](https://crowdin.com/) service that we use to crowd source
    translations,

At "France Université Numérique", we deploy our applications on `Kubernetes`
using [`Arnold`](https://github.com/openfun/arnold).

## Docker

First, make sure you have a recent version of Docker and
[Docker Compose](https://docs.docker.com/compose/install) installed on your
laptop:

```bash
$ docker -v
  Docker version 20.10.12, build e91ed57

$ docker-compose --version
  docker-compose version 1.29.2, build 5becea4c
```

⚠️ You may need to run the following commands with `sudo` but this can be
avoided by assigning your user to the `docker` group.

### Project bootstrap

The easiest way to start working on the project is to use our `Makefile`:

    $ make bootstrap

This command builds the `app` container, installs front-end and back-end
dependencies, builds the front-end application and styles, and performs
database migrations. It's a good idea to use this command each time you are
pulling code from the project repository to avoid dependency-related or
migration-related issues.

Now that your `Docker` services are ready to be used, start the full CMS by
running:

    $ make run

### Adding content

Once the CMS is up and running, you can create a superuser account:

    $ make superuser

You can create a basic demo site by running:

    $ make demo-site

Note that if you don't create the demo site and start from a blank CMS, you
will get some errors requesting you to create some required root pages. So it
is easier as a first approach to test the CMS with the demo site.

You should be able to view the site at [localhost:8070](http://localhost:8070)

## Connecting Richie to an LMS

It is possible to use Richie as a catalogue aggregating courses from one or
more LMS without any specific connection. In this case, each course run in
the catalogue points to a course on the LMS, and the LMS points back to the
catalogue to browse courses.

This approach is used for example on https://www.fun-campus.fr or
https://catalogue.edulib.org.

For a seamless user experience, it is possible to connect a Richie instance
to an OpenEdX instance (or some other LMS like Moodle at the cost of minor
adaptations), in several ways that we explain in the
[LMS connection guide](lms-connection).

This approach is used for example on https://www.fun-mooc.fr or
https://www.nau.edu.pt.
