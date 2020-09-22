---
id: contributing-guide
title: Contributing guide
sidebar_label: Contributing guide
---

This project is intended to be community-driven, so please, do not hesitate to get in touch if you have any question related to our implementation or design decisions.

We try to raise our code quality standards and expect contributors to follow the recommandations
from our [handbook](https://openfun.gitbooks.io/handbook/content).

## Checking your code

We use strict flake8, pylint, isort and black linters to check the validity of our backend code:

    $ make lint-back

We use strict eslint and prettier to check the validity of our frontend code:

    $ make lint-front

## Running tests

On the backend, we use pytest to run our test suite:

    $ make test-back

On the frontend, we use karma to run our test suite:

    $ make test-front

## Running migrations

The first time you start the project with `make bootstrap`, the `db` container automatically
creates a fresh database named `richie` and performs database migrations. Each time a new
**database migration** is added to the code, you can synchronize the database schema by running:

    $ make migrate

## Handling new dependencies

Each time you add new front-end or back-end dependencies, you will need to rebuild the
application. We recommend to use:

    $ make bootstrap

## Going further

To see all available commands, run:

    $ make

We also provide shortcuts for docker-compose commands as sugar scripts in the
`bin/` directory:

```
bin
├── exec
├── pylint
├── pytest
└── run
```

More details and tips & tricks can be found in our [development with Docker
documentation](docker-development.md)

## Troubleshooting

### Chrome strict cookie policy

Since Chrome 81, the `SameSite` cookie attribute now defaults to `Lax`, meaning that these cookies will not be share between different domains by default. To be allow to be send accross different domains, a cookie must have `SameSite` sets to `None`. Because cookies can contains confidential information, Chrome requires that cookies with `SameSite: None` has also the flag `Secure` enabled.
Furthermore, Chrome also blocks cookies sent from localhost.
To resume, Chrome requires TLS and a hostname different than `localhost` to share cookies between two websites.

Since Richie uses OpenEDX as OAuth2 provider, we need to make some requests between the
two platforms to get information about the user session. This means that in order to develop with Chrome, we need to run your local instance of richie and openedx behind TLS.

#### Configure your hosts to not use localhost

```
    vi /etc/hosts

    --- Add these two lines
    richie       localhost
    edx          localhost
```

#### Enable TLS on a local server

A simple solution is to use [stunnel](https://www.stunnel.org/) as a local TLS proxy. You only have to follow these three steps:

1. **Generate a valid SSL certificate**

   There is lot of resources on the web to do that. [This article is a good example](https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/).

2. **Create a stunnel configuration file**

   You can find [a full configuration template in the stunnel documentation](https://www.stunnel.org/config_unix.html). Otherwise, here a simple example to serve OpenEDX and Richie over TLS:

```
; Global configuration
foreground = yes

; TLS over Richie
[https]
cert = /any/path/to/your/generated/certificate.pem
accept = 8470
connect = 8070

; TLS over OpenEDX
[https]
cert = /any/path/to/your/generated/certificate.pem
accept = 8473
connect = 8073
```

3. **Run stunnel**

   `stunnel <PATH_TO_STUNNEL_CONFIG_FILE>`

If you follow these instructions, you should be able to access to Richie from `https://richie:8470` and to OpenEDX from `https://edx:8473`. Congratulations you can now use your favorite browser to develop!
