# Richie site factory

This repository is a workbench to develop themed sites based on
[Richie](https://github.com/openfun/richie), the CMS for Open Education.

## Prerequisite

First, make sure you have a recent version of Docker and [Docker
Compose](https://docs.docker.com/compose/install) installed on your laptop:

```
$ docker -v
  Docker version 19.03.10, build 9424aeaee9

$ docker-compose --version
  docker-compose version 1.25.5, build 8a1c60f6
```

## Getting started

First, you need to create a new site in your site factory. You will be
prompted for a name and a domain for this site:

```bash
$ make add-site
> site: mysite
```

You can check that your site was created and explore its content:

```bash
$ ls sites/mysite
```

You can now activate the site on which you want to work. We provide
a script that will list existing sites and let you choose one:

```bash
$ bin/activate
Select an available site to activate:
[1] demo (default)
[2] mysite
Your choice: 2

# Check your environment with:
$ make info
RICHIE_SITE: mysite
```

Once your environment is set, start the full project by running:

```bash
$ make bootstrap
```

This command builds the containers, starts the services and performs
database migrations. It's a good idea to use this command each time you are
pulling code from the project repository to avoid dependency-related or
migration-related issues.

Once the bootstrap phase is finished, you should be able to view the site at
[localhost:8070](http://localhost:8070)

> If you've just bootstrapped this project, you are probably planning to use AWS
> to store and distribute your media and static files. Luckily for you, we've
> cooked `terraform` scripts and a documentation for you! Read more about it:
> [docs/aws.md](./docs/aws.md)

## Usage

### Managing services

If you need to build or rebuild the containers, use:

```
$ make build
```

> Note that if the services are already running, you will need to stop them
> first and then restart them to fire up your newly built containers.

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

### Upgrading to a newer richie version

Upgrading one or many projects to a newer version of [richie](https://github.com/openfun/richie)
is automated.

For example, to upgrade a specific site, test its build after upgrade and commit all changes:

```
bin/upgrade demo --build --commit
```

To upgrade a list of 3 sites but without testing the build or committing the changes:

```
bin/upgrade demo yoursite1 yoursite2
```

To upgrade all the sites handled in the site factory:

```
bin/upgrade --build --commit
```

### Making a release

Making a release is automated. The choice between a minor or a revision type of release is
determined by the presence of an addition, a change or a removal. A revision release is made
if only fixes are present in the changelog, otherwise a minor release is made.

For example, to release a specific site and commit all changes:

```
bin/release demo --commit
```

If you consider that the changelog contains breaking changes, you can force a major release
by passing the parameter `--major`.


To release a list of 3 sites but without committing the changes:

```
bin/release demo yoursite1 yoursite2 --major
```

To release all the sites handled in the site factory:

```
bin/release --commit
```

After merging release commits to the main branch, you can tag them automatically by running:

```
bin/tag -c
```

## License

This work is released under the GNU Affero General Public License v3.0 (see
[LICENSE](./LICENSE)).
