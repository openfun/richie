---
id: docker-development
title: Developing Richie with Docker
sidebar_label: Docker development
---

Now that you have `Richie` up and running, you can start working with it.

## Settings

Settings are defined using [Django
Configurations](https://django-configurations.readthedocs.io/en/stable/) for
different environments:

- `Development`: settings for development on developers' local environment,
- `Test`: settings used to run our test suite,
- `ContinousIntegration`: settings used on the continuous integration platform,
- `Feature`: settings for deployment of each developers' feature branches,
- `Staging`: settings for deployment to the staging environment,
- `PreProduction`: settings for deployment to the pre-production environment,
- `Production`: settings for deployment to the production environment.

The `Development` environment is defined as the default environment.

## Front-end tools

If you intend to work on the front-end development of the CMS, we also have
sweet candies for you! 🤓

```bash
# Start the Sass watcher
$ make watch-sass

# In a new terminal or session, start the TypeScript watcher
$ make watch-ts
```

## Container control

You can stop/start/restart a container:

    $ docker-compose [stop|start|restart] [app|postgresql|mysql|elasticsearch]

or stop/start/restart all containers in one command:

    $ docker-compose [stop|start|restart]

## Debugging

You can easily see the latest logs for a container:

    $ docker-compose logs [app|postgresql|mysql|elasticsearch]

Or follow the stream of logs:

    $ docker-compose logs --follow [app|postgresql|mysql|elasticsearch]

If you need to debug a running container, you can open a Linux shell with the
`docker-compose exec` command (we use a sugar script here, see next section):

    $ bin/exec [app|postgresql|mysql|elasticsearch] bash

While developing on `Richie`, you will also need to run a `Django shell` and it
has to be done in the `app` container (we use a sugar script here, see next
section):

    $ bin/run app python sandbox/manage.py shell

## Using sugar scripts

While developing using Docker, you will fall into permission issues if you mount
the code directory as a volume in the container. Indeed, the Docker engine will,
by default, run the containers using the `root` user. Any file created or
updated by the app container on your host, as a result of the volume mounts,
will be owned by the local root user. One way to solve this is to use the
`--user="$(id -u)"` flag when calling the `docker-compose run` or
`docker-compose exec` commands. By using the user flag trick, the running
container user ID will match your local user ID. But, as it's repetitive and
error-prone, we provide shortcuts that we call our "sugar scripts":

- `bin/run`: is a shortcut for `docker-compose run --rm --user="$(id -u)"`
- `bin/exec`: is a shortcut for `docker-compose exec --user="$(id -u)"`
- `bin/pylint`: runs `pylint` in the `app` service using the test docker-compose
  file
- `bin/pytest`: runs `pytest` in the `app` service using the test docker-compose
  file

## Cleanup

If you work on the Docker configuration and make repeated modifications,
remember to periodically clean the unused docker images and containers by
running:

    $ docker image prune
    $ docker container prune

## Troubleshooting

### ElasticSearch service is always down

If your `elasticsearch` container fails at booting, checkout the logs via:

```bash
$ docker-compose logs elasticsearch
```

You may see entries similar to:

```
[1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

In this case, increase virtual memory as follows (UNIX systems):

```
$ sudo sysctl -w vm/max_map_count=262144
```
