# Using Docker for development

`FUN CMS` includes a complete configuration to use Docker in development.


## Services

The project is defined using a [docker-compose file](../docker-compose.yml) and consists of 5 services:

- **nginx**: the front end web server configured to serve static/media files and proxy other requests to Django,
- **db**: the SQL database,
- **elasticsearch**: the search engine,
- **app**: the actual Django CMS project with all our application code,
- **node**: used for front-end related tasks, _i.e._ transpiling TypeScript sources, bundling them into a JS package, and building the CSS files from Sass sources.

This default `docker-compose` configuration is intended for development, so we are:

- using `runserver`,
- mounting (not copying) the source code from our host in the app container,
- mounting (not copying) the static/media folders from our host:
    * in the `app` container (so that we can run `collecstatic` from the app container without installing the project on our laptop),
    * in the `nginx` container as readonly (for nginx to serve files).

This will allow for any code changes to be immediately visible upon save.


## Getting started

First, make sure you have a recent version of Docker and [Docker Compose](https://docs.docker.com/compose/install) installed on your laptop:

```bash
$ docker -v
  Docker version 1.13.1, build 092cba3

$ docker-compose --version
  docker-compose version 1.17.1, build 6d101fb
```

The easiest way to start working on the project is to use our `Makefile`:

    $ make bootstrap

This command builds the `app` container, installs front-end and back-end dependencies, builds the front-end application and styles, and performs database migrations. It's a good idea to use this command each time you are pulling code from the project repository to avoid dependency-related or migration-related issues.

Now that your docker-services are ready to be used, each time you want to work on the project, starting the full CMS is as simple as placing yourself at the root of the project and running:

```bash
$ docker-compose up -d --build

# or alternatively use the Makefile shortcut
$ make run
```

You may need to run this command with `sudo` but this can be avoided by assigning your user to the `docker` group.

The 3 containers (`nginx`, `db` and `app`) should now be running and you should see them in the list rendered by the `ps` command:

    $ docker-compose ps

The first time you start the project with `make bootstrap`, the `db` container automatically creates a fresh database named `fun_cms` and performs database migrations. Each time a new **database migration** is added to the code, you can synchronize the database schema by running:

```bash
$ docker-compose exec app python manage.py migrate

# or alternatively use the Makefile shortcut
$ make migrate
```

Once the CMS is up and running, you can create a superuser account:

    $ docker-compose exec app python manage.py createsuperuser

You should now be able to view the site:

- served directly by runserver at [localhost:8070](http://localhost:8070): static files always up-to-date without running collectstatic.
- served by nginx at [localhost:8071](http://localhost:8071): handles requests "as in production",

### Front-end tools

If you intend to work on the front-end development of the CMS, we also have sweet candies for you! 🤓

```bash
# Start the Sass watcher
$ make watch-css

# In a new terminal or session, start the TypeScript watcher
$ make watch-ts
```

## To go further

### Container control

You can stop/start/restart a container:

    $ docker-compose [stop|start|restart] [db|app|nginx]

or stop/start/restart all containers in one command:

    $ docker-compose [stop|start|restart]


### Debugging

You can easily see the latest logs for a container:

    $ docker-compose logs [db|app|nginx]

Or follow the stream of logs:

    $ docker logs --follow --until=2s

If you need to debug inside a container, you can open a Linux shell with the `exec` command:

    $ docker-compose exec [db|app|nginx] /bin/sh

While developing on `FUN CMS`, you will also need to run a `Django shell` and it has to be done in the `app` container:

    $ docker-compose exec app python manage.py shell


### Handling new dependencies

Each time you add new front-end or back-end dependencies, you will need to rebuild the application. We recommend to use:

    $ make bootstrap

### Running tests

The test suite should be run from within the `app` container:

    $ docker-compose exec app python manage.py test


### Cleanup

If you work on the Docker configuration and make repeated modifications, remember to periodically clean the unused docker images by running:

    $ docker image prune
