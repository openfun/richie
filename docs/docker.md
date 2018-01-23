# Using Docker for development

`FUN CMS` includes a complete configuration to use Docker in development.


## Services

The project is defined using a [docker-compose file](../docker-compose.yml) and consists of 4 services:

- **nginx:** the front end web server configured to serve static/media files and proxy other requests to Django,
- **db:** the SQL database,
- **app:** the actual Django CMS project with all our application code,
- **typescript:** a webpack process that transpiles our sources and bundles them into a JS package,
- **sass:** builds the output CSS file from `app/` to `static/`.

This default `docker-compose` configuration is intended for development, so we are:

- using `runserver`,
- mounting (not copying) the source code from our host in the app container,
- mounting (not copying) the static/media folders from our host:
    * in the app container (so that we can run collecstatic from the app container without installing the project on our laptop),
    * in the nginx container as readonly (for nginx to serve files).

This will allow for any code changes to be immediately visible upon save.


## Getting started

First, make sure you have a recent version of Docker and [Docker Compose](https://docs.docker.com/compose/install) installed on your laptop:

    $ docker -v
      Docker version 1.13.1, build 092cba3

    $ docker-compose --version
      docker-compose version 1.17.1, build 6d101fb

Each you want to work on the project, starting the full CMS is as simple as placing yourself at the root of the project and running:

    $ docker-compose up -d --build

You may need to run this command with `sudo` but this can be avoided by assigning your user to the `docker` group.

The 3 containers (nginx, db and app) should now be running and you should see them in the list rendered by the `ps` command:

    $ docker-compose ps

The first time you start the project, the `db` container automatically creates a fresh database named `fun_cms`. From the `app` container, you should now synchronize the database schema by running all available migrations:

    $ docker-compose exec app python manage.py migrate

You should also run the same command on the `app` container each time a new **database migration** is added to the code.

You can also create a superuser account:

    $ docker-compose exec app python manage.py createsuperuser

You should now be able to view the site:

- served directly by runserver at [localhost:8070](http://localhost:8070): static files always up-to-date without running collectstatic.
- served by nginx at [localhost:8071](http://localhost:8071): handles requests "as in production",


## To go further

### Container control

You can stop/start/restart a container:

    $ docker-compose [stop|start|restart] [db|app|nginx]

or stop/start/restart all containers in one command:

    $ docker-compose [stop|start|restart]


### Debugging

You can easily see the last logs for a container:

    $ docker-compose logs [db|app|nginx]

Or follow the stream of logs:

    $ docker logs --follow --until=2s

If you need to debug inside a container, you can open a Linux shell with the `exec` command:

    $ docker-compose exec [db|app|nginx] /bin/sh

While developping on `FUN CMS`, you will also need to run a `Django shell` and it has to be done in the `app` container:

    $ docker-compose exec app python manage.py shell


### Running tests

The test suite should be run from within the `app` container:

    $ docker-compose exec app python manage.py test


### Cleanup

If you work on the Docker configuration and make repeated modifications, remember to periodically clean the unused docker images by running:

    $ docker image prune
