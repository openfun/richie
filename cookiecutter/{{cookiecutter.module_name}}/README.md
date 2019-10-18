# {{cookiecutter.project_name.upper()}}

This repository contains the code for the {{cookiecutter.project_name}} website. It is
based on [Richie](https://github.com/openfun/richie), a CMS for Open Education.

## Getting started

First, make sure you have a recent version of Docker and [Docker
Compose](https://docs.docker.com/compose/install) installed on your laptop:

```
$ docker -v
  Docker version 1.13.1, build 092cba3

$ docker-compose --version
  docker-compose version 1.17.1, build 6d101fb
```

The easiest way to start working on the project is to use our `Makefile`:

```
$ make bootstrap
```

This command builds the `app` container, starts the service and performs
database migrations. It's a good idea to use this command each time you are
pulling code from the project repository to avoid dependency-related or
migration-related issues.

Once the bootstrap phase is finished, you should be able to view the site at
[localhost:8080](http://localhost:8080)

> If you've just bootstrapped this project, you are probably planning to use AWS
> to store and distribute your media and static files. Luckily for you, we've
> cooked `terraform` scripts and a documentation for you! Read more about it:
> [docs/aws.md](./docs/aws.md)

## Usage

### Managing services

If you need to build or rebuild the `app` container, use:

```
$ make build
```

> Note that if the `app` service is already running, you will need to stop it
> first and then restart it to fire up your newly build container.

To start the development stack (_via_ Docker compose), use:

```
$ make run
```

You can inspect logs (in follow mode) with:

```
$ make logs
```

You can stop all services with:

```
$ make stop
```

If you need to stop and remove containers (to drop your database for example),
there is a command for that:

```
$ make down
```

### Housekeeping

Once the CMS is up and running, you can create a superuser account:

```
$ make superuser
```

To perform database migrations, use:

```
$ make migrate
```

You can create a basic demo site by running:

```
$ make demo-site
```

> Note that if you don't create the demo site and start from a blank CMS, you
> will get some errors requesting you to create some required root pages. So it
> is easier as a first approach to test the CMS with the demo site.

### Going further

To see all available commands, run:

```
$ make help
```

## Contributing

This project is intended to be community-driven, so please, do not hesitate to
get in touch if you have any question related to our implementation or design
decisions.

We try to raise our code quality standards and expect contributors to follow the
recommandations from our
[handbook](https://openfun.gitbooks.io/handbook/content).

## License

This work is released under the GNU Affero General Public License v3.0 (see
[LICENSE](./LICENSE)).
