## To go further with development

### Settings

Settings are defined using [Django Configuration]
(https://django-configurations.readthedocs.io/en/stable/) for different environments:

- Development: settings for development on developpers' local environment,
- Test: settings used to run our test suite,
- ContinousIntegration: settings used on the continuous integration platform,
- Feature: settings for deployment of each developers' feature branches,
- Staging: settings for deployment to the staging environment,
- PreProduction: settings for deployment to the pre-production environment,
- Production: settings for deployment to the production environment.

The `Development` environment is defined as the default environment.


### Front-end tools

If you intend to work on the front-end development of the CMS, we also have sweet candies for you! 🤓

```bash
# Start the Sass watcher
$ make watch-css

# In a new terminal or session, start the TypeScript watcher
$ make watch-ts
```


### Container control

You can stop/start/restart a container:

    $ docker-compose [stop|start|restart] [app|db|elasticsearch]

or stop/start/restart all containers in one command:

    $ docker-compose [stop|start|restart]


### Debugging

You can easily see the latest logs for a container:

    $ docker-compose logs [app|db|elasticsearch]

Or follow the stream of logs:

    $ docker logs --follow --until=2s

If you need to debug a running container, you can open a Linux shell with the `exec` command:

    $ docker-compose exec [app|db|nginx] bash

While developing on `Richie`, you will also need to run a `Django shell` and it has to be done in
the `app` container:

    $ docker-compose run --rm app python sandbox/manage.py shell


### Cleanup

If you work on the Docker configuration and make repeated modifications, remember to periodically
clean the unused docker images and containers by running:

    $ docker image prune
    $ docker container prune


### Troubleshooting

#### ElasticSearch service is always down

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
