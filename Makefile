# Richie's Makefile
#
# /!\ /!\ /!\ /!\ /!\ /!\ /!\ DISCLAIMER /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\
#
# This Makefile is only meant to be used for DEVELOPMENT purpose as we are
# changing the user id that will run in the container.
#
# PLEASE DO NOT USE IT FOR YOUR CI/PRODUCTION/WHATEVER...
#
# /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\ /!\

# -- Docker

# Get the current user ID to use for docker run and docker exec commands
UID                  = $(shell id -u)
COMPOSE              = docker-compose
COMPOSE_RUN          = $(COMPOSE) run --rm --user=$(UID)
COMPOSE_EXEC         = $(COMPOSE) exec --user=$(UID)
COMPOSE_EXEC_APP     = $(COMPOSE_EXEC) app
COMPOSE_EXEC_NODE    = $(COMPOSE_EXEC) node
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) node
COMPOSE_TEST         = $(COMPOSE) -p richie-test -f docker/compose/test/docker-compose.yml --project-directory .
COMPOSE_TEST_RUN     = $(COMPOSE_TEST) run --rm --user=$(UID)
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app

# -- Node

YARN                 = $(COMPOSE_RUN_NODE) yarn

# -- Django

MANAGE               = $(COMPOSE_RUN_APP) python sandbox/manage.py

# -- Rules

default: help

bootstrap:  ## install development dependencies
	@$(COMPOSE) build base;
	@$(COMPOSE) build app;
	${MAKE} build-front;
	@echo 'Waiting until database is up…';
	$(COMPOSE_RUN_APP) dockerize -wait tcp://db:5432 -timeout 60s
	${MAKE} migrate;
.PHONY: bootstrap

build-saas: ## build Sass files to CSS
	@$(YARN) sass
.PHONY: build-saas

build-front: ## build front-end application
	@$(YARN) install;
	${MAKE} build-ts;
	${MAKE} build-saas;
.PHONY: build-front

build-ts: ## build TypeScript application
	@$(YARN) build
.PHONY: build-ts

demo-site:  ## create a demo site
	@$(MANAGE) create_demo_site
.PHONY: demo-site

lint-back: ## lint back-end python sources
	${MAKE} lint-back-isort;
	${MAKE} lint-back-black;  # black should come after isort just in case they don't agree...
	${MAKE} lint-back-flake8;
	${MAKE} lint-back-pylint;
.PHONY: lint-back

lint-back-black: ## lint back-end python sources with black
	@echo 'lint:black started…';
	@$(COMPOSE_TEST_RUN_APP) black src/richie/apps src/richie/plugins sandbox;
.PHONY: lint-back-black

lint-back-flake8: ## lint back-end python sources with flake8
	@echo 'lint:flake8 started…';
	@$(COMPOSE_TEST_RUN_APP) flake8;
.PHONY: lint-back-flake8

lint-back-isort: ## automatically re-arrange python imports in back-end code base
	@echo 'lint:isort started…';
	@$(COMPOSE_TEST_RUN_APP) isort --recursive --atomic .;
.PHONY: lint-back-isort

lint-back-pylint: ## lint back-end python sources with pylint
	@echo 'lint:pylint started…';
	@$(COMPOSE_TEST_RUN_APP) pylint src/richie/apps src/richie/plugins sandbox;
.PHONY: lint-back-pylint

lint-front: ## lint TypeScript sources
	@$(YARN) lint
.PHONY: lint-front

logs: ## get development logs
	@$(COMPOSE) logs -f
.PHONY: logs

migrate:  ## perform database migrations
	@$(MANAGE) migrate
.PHONY: migrate

rebuild: ## rebuild the app container
	@$(COMPOSE) build app
.PHONY: rebuild

run: ## start the development server
	@$(COMPOSE) up -d
.PHONY: run

stop: ## stop the development server
	@$(COMPOSE) stop
.PHONY: stop

superuser: ## create a DjangoCMS superuser
	@$(MANAGE) createsuperuser
.PHONY: superuser

test-back: ## run back-end tests
	@$(COMPOSE_TEST_RUN_APP) pytest
.PHONY: test-back

test-front: ## run front-end tests
	@$(YARN) test
.PHONY: test-front

watch-sass: ## watch changes in Sass files
	@$(YARN) watch-sass
.PHONY: watch-sass

watch-ts: ## watch changes in TypeScript files
	@$(YARN) build --watch
.PHONY: watch-ts

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help
