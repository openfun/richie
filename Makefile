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
ifeq ($(DB_ENGINE), mysql)
  _COMPOSE            = docker-compose -f docker/compose/development/mysql/docker-compose.yml --project-directory .
  DB_PORT            = 3306
else
  _COMPOSE            = docker-compose
  DB_PORT            = 5432
endif

DOCKER_UID           = $(shell id -u)
DOCKER_GID           = $(shell id -g)
DOCKER_USER          = $(DOCKER_UID):$(DOCKER_GID)
COMPOSE              = DOCKER_USER=$(DOCKER_USER) $(_COMPOSE)
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_EXEC         = $(COMPOSE) exec
COMPOSE_EXEC_APP     = $(COMPOSE_EXEC) app
COMPOSE_EXEC_NODE    = $(COMPOSE_EXEC) node
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_CROWDIN  = $(COMPOSE_RUN) crowdin -c crowdin/config.yml
COMPOSE_TEST_RUN     = $(COMPOSE) run --rm -e DJANGO_CONFIGURATION=Test
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app

# -- Node

# We must run node with a /home because yarn tries to write to ~/.yarnrc. If the ID of our host
# user (with which we run the container) does not exist in the container (e.g. 1000 exists but
# 1009 does not exist by default), then yarn will try to write to "/.yarnrc" at the root of the
# system and will fail with a permission error.
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) -e HOME="/tmp" node
YARN                 = $(COMPOSE_RUN_NODE) yarn

# -- Django

MANAGE               = $(COMPOSE_RUN_APP) dockerize -wait tcp://db:$(DB_PORT) -timeout 60s python sandbox/manage.py

# -- Rules

default: help

env.d/development/crowdin:
	cp env.d/development/crowdin.dist env.d/development/crowdin

data/media/.keep:
	@echo 'Preparing media volume...'
	@mkdir -p data/media/
	@touch data/media/.keep

data/static/.keep:
	@echo 'Preparing static volume...'
	@mkdir -p data/static
	@touch data/static/.keep

bootstrap: env.d/development/crowdin data/media/.keep data/static/.keep build-front build run migrate ## install development dependencies
.PHONY: bootstrap

build-sass: ## build Sass files to CSS
	@$(YARN) sass
.PHONY: build-sass

build-front: ## build front-end application
	@$(YARN) install;
	${MAKE} build-ts;
	${MAKE} build-sass;
.PHONY: build-front

build-ts: ## build TypeScript application
	@$(YARN) build
.PHONY: build-ts

clean: ## restore repository state as it was freshly cloned
	git clean -idx

compilemessages: ## compile the gettext files
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py compilemessages

demo-site:  ## create a demo site
	@$(MANAGE) flush
	@$(MANAGE) create_demo_site
	@${MAKE} search-index;
.PHONY: demo-site

search-index:  ## (re)generate the Elasticsearch index
	@$(MANAGE) bootstrap_elasticsearch
.PHONY: search-index

lint-back: lint-back-isort  lint-back-black lint-back-flake8 lint-back-pylint ## lint back-end python sources
.PHONY: lint-back # black should come after isort just in case they don't agree...

lint-back-black: ## lint back-end python sources with black
	@echo 'lint:black started…';
	@$(COMPOSE_TEST_RUN_APP) black src/richie/apps src/richie/plugins sandbox tests;
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
	@$(COMPOSE_TEST_RUN_APP) pylint src/richie/apps src/richie/plugins sandbox tests;
.PHONY: lint-back-pylint

lint-front: lint-front-tslint lint-front-prettier ## run both front-end "linters" prettier & tslint
.PHONY: lint-front

lint-front-tslint: ## lint TypeScript sources
	@$(YARN) lint
.PHONY: lint-front-tslint

lint-front-prettier: ## run prettier over js/jsx/json/ts/tsx files -- beware! overwrites files
	@$(YARN) prettier-write
.PHONY: lint-front-prettier

logs: ## get development logs
	@$(COMPOSE) logs -f
.PHONY: logs

messages: ## create the .po files used for i18n
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py makemessages --keep-pot

migrate:  ## perform database migrations
	@$(MANAGE) migrate
.PHONY: migrate

build: ## build the app container
	@$(COMPOSE) build app
.PHONY: build

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
	@bin/pytest
.PHONY: test-back

test-front: ## run front-end tests
	@$(YARN) test --runInBand
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

###########################################
# Translations tasks

.PHONY: i18n-generate
i18n-generate: i18n-generate-back i18n-generate-front ## Generate source translations files for all applications

.PHONY: i18n-compile
i18n-compile: i18n-compile-back i18n-compile-front ## Compile translated messages to be used by all applications

.PHONY: i18n-generate-front
i18n-generate-front:
	@$(YARN) build
	@$(YARN) generate-l10n-template

.PHONY: i18n-compile-front
i18n-compile-front:
	@$(YARN) generate-translations

.PHONY: i18n-generate-back
i18n-generate-back:
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py makemessages --ignore "venv/**/*" --keep-pot

.PHONY: i18n-compile-back
i18n-compile-back:
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py compilemessages

.PHONY: crowdin-upload
crowdin-upload: ## Upload source translations to Crowdin
	@$(COMPOSE_RUN_CROWDIN) upload sources

.PHONY: crowdin-download
crowdin-download: ## Download translated message from Crowdin
	@$(COMPOSE_RUN_CROWDIN) download translations

.PHONY: i18n-generate-and-upload
i18n-generate-and-upload: i18n-generate crowdin-upload ## Generate source translations for all applications and upload then to crowdin

.PHONY: i18n-download-and-compile
i18n-download-and-compile: crowdin-download i18n-compile ## Download all translated messages and compile them to be used by all applications
