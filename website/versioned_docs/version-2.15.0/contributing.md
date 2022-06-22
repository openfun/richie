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
