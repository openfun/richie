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
#
# Note to developpers:
#
# While editing this file, please respect the following statements:
#
# 1. Every variable should be defined in the ad hoc VARIABLES section with a
#    relevant subsection
# 2. Every new rule should be defined in the ad hoc RULES section with a
#    relevant subsection depending on the targeted service
# 3. Rules should be sorted alphabetically within their section
# 4. When a rule has multiple dependencies, you should:
#    - duplicate the rule name to add the help string (if required)
#    - write one dependency per line to increase readability and diffs
# 5. .PHONY rule statement should be written after the corresponding rule

# ==============================================================================
# VARIABLES

# -- Database
# Database engine switch: if the DB_HOST=mysql environment variable is defined,
# we'll use the mysql docker-compose service as a database backend instead of
# postgresql (default).
ifeq ($(DB_HOST), mysql)
  DB_PORT            = 3306
else
  DB_HOST            = postgresql
  DB_PORT            = 5432
endif

# -- Docker
# Get the current user ID to use for docker run and docker exec commands
DOCKER_UID           = $(shell id -u)
DOCKER_GID           = $(shell id -g)
DOCKER_USER          = $(DOCKER_UID):$(DOCKER_GID)
COMPOSE              = DOCKER_USER=$(DOCKER_USER) DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) docker-compose
COMPOSE_SSL          = NGINX_CONF=ssl DEV_ENV_FILE=dev-ssl $(COMPOSE)
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_RUN_SSL      = $(COMPOSE_SSL) run --rm
COMPOSE_EXEC         = $(COMPOSE) exec
COMPOSE_EXEC_APP     = $(COMPOSE_EXEC) app
COMPOSE_EXEC_FRONTEND= $(COMPOSE_EXEC) frontend
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_SSL_APP  = $(COMPOSE_RUN_SSL) app
COMPOSE_RUN_CROWDIN  = $(COMPOSE_RUN) crowdin crowdin
COMPOSE_TEST_RUN     = $(COMPOSE) run --rm -e DJANGO_CONFIGURATION=Test
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app

PYTHON_FILES         = src/richie/apps src/richie/plugins sandbox

# -- Frontend
# We must run frontend with a /home because yarn tries to write to ~/.yarnrc. If the
# ID of our host user (with which we run the container) does not exist in the
# container (e.g. 1000 exists but 1009 does not exist by default), then yarn
# will try to write to "/.yarnrc" at the root of the system and will fail with a
# permission error.
COMPOSE_RUN_FRONTEND = $(COMPOSE_RUN) -e HOME="/tmp" frontend
YARN                 = $(COMPOSE_RUN_FRONTEND) yarn

# -- Django
MANAGE               = $(COMPOSE_RUN_APP) python sandbox/manage.py
MANAGE_SSL           = $(COMPOSE_RUN_SSL_APP) python sandbox/manage.py
WAIT_DB              = $(COMPOSE_RUN) dockerize -wait tcp://$(DB_HOST):$(DB_PORT) -timeout 60s
WAIT_ES              = $(COMPOSE_RUN) dockerize -wait tcp://elasticsearch:9200 -timeout 60s
WAIT_APP             = $(COMPOSE_RUN) dockerize -wait tcp://app:8000 -timeout 60s

# ==============================================================================
# RULES

default: help

# -- Project
bootstrap: ## install development dependencies
bootstrap: \
  env.d/development/common \
  env.d/development/dev \
  env.d/development/dev-ssl \
  env.d/development/crowdin \
  data/media/.keep \
  data/smedia/.keep \
  data/static/.keep \
  build-front \
  build \
  run \
  migrate \
  superuser
.PHONY: bootstrap

# -- Docker/compose
build: ## build the app container
	@$(COMPOSE) build app
.PHONY: build

down: ## remove stack (warning: it removes the database container)
	@$(COMPOSE) down
.PHONY: down

logs: ## display app logs (follow mode)
	@$(COMPOSE) logs -f app
.PHONY: logs

run: ## start the development server
	@$(COMPOSE) up -d nginx
	@echo "Wait for services to be up..."
	@$(WAIT_DB)
	@$(WAIT_ES)
	@$(WAIT_APP)
.PHONY: run

run-ssl: ## start the development server over TLS
	@$(COMPOSE_SSL) up -d nginx
	@echo "Wait for services to be up..."
	@$(WAIT_DB)
	@$(WAIT_ES)
	@$(WAIT_APP)
.PHONY: run-ssl

status: ## an alias for "docker-compose ps"
	@$(COMPOSE) ps
.PHONY: status

stop: ## stop the development server
	@$(COMPOSE) stop
.PHONY: stop

# -- Front-end
build-front: ## build front-end application
build-front: \
  install-front \
  build-ts \
  build-sass
.PHONY: build-front

build-sass: ## build Sass files to CSS
	@$(YARN) build-sass
.PHONY: build-sass

build-ts: ## build TypeScript application
	@$(YARN) compile-translations
	@$(YARN) build-ts
.PHONY: build-ts

install-front: ## install front-end dependencies
	@$(YARN) install
.PHONY: install-front

lint-front: ## run all front-end "linters"
lint-front: \
  lint-front-eslint \
  lint-front-prettier
.PHONY: lint-front

lint-front-prettier: ## run prettier over js/jsx/json/ts/tsx files -- beware! overwrites files
	@$(YARN) prettier-write
.PHONY: lint-front-prettier

lint-front-eslint: ## lint TypeScript sources
	@$(YARN) lint
.PHONY: lint-front-eslint

run-storybook: ## Run front-end's storybook
	@$(COMPOSE) up -d storybook
.PHONY: run-storybook

stop-storybook: ## Stop front-end's storybook
	@$(COMPOSE) stop storybook
.PHONY: stop-storybook

test-front: ## run front-end tests, or specific test like `make test-front js/components/CourseRunEnrollment`
	@args="$(filter-out $@,$(MAKECMDGOALS))" && \
	$(YARN) test $${args:-${1}}
.PHONY: test-front

watch-sass: ## watch changes in Sass files
	@$(YARN) watch-sass
.PHONY: watch-sass

watch-ts: ## watch changes in TypeScript files
	@$(YARN) watch-ts
.PHONY: watch-ts

# -- Back-end
compilemessages: ## compile the gettext files
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py compilemessages
.PHONY: compilemessages

demo-site: ## create a demo site if app container is running
	@echo "Check app container is running..."
	@if [ $(shell docker container inspect -f '{{.State.Running}}' "$(shell $(COMPOSE) ps -q app)") = "false" ] ; then\
		echo "❌ App must be up and running to create demo site.";\
		exit 1;\
	fi
	@$(MANAGE) flush
	@$(COMPOSE_EXEC_APP) python sandbox/manage.py create_demo_site
	@${MAKE} search-index
	@${MAKE} superuser
.PHONY: demo-site

# Nota bene: Black should come after isort just in case they don't agree...
lint-back: ## lint back-end python sources
lint-back: \
  lint-back-isort \
  lint-back-black \
  lint-back-flake8 \
  lint-back-pylint \
  lint-back-bandit
.PHONY: lint-back

lint-back-diff: ## lint back-end python sources, but only what has changed since master
	@bin/lint-back-diff
.PHONY: lint-back-diff

lint-back-black: ## lint back-end python sources with black
	@echo 'lint:black started…'
	@$(COMPOSE_TEST_RUN_APP) black .
.PHONY: lint-back-black

lint-back-flake8: ## lint back-end python sources with flake8
	@echo 'lint:flake8 started…'
	@$(COMPOSE_TEST_RUN_APP) flake8 ${PYTHON_FILES} tests
.PHONY: lint-back-flake8

lint-back-isort: ## automatically re-arrange python imports in back-end code base
	@echo 'lint:isort started…'
	@$(COMPOSE_TEST_RUN_APP) isort --atomic ${PYTHON_FILES} tests
.PHONY: lint-back-isort

lint-back-pylint: ## lint back-end python sources with pylint
	@echo 'lint:pylint started…'
	@$(COMPOSE_TEST_RUN_APP) pylint ${PYTHON_FILES} tests
.PHONY: lint-back-pylint

lint-back-bandit: ## lint back-end python sources with bandit
	@echo 'lint:bandit started…'
	@$(COMPOSE_TEST_RUN_APP) bandit -qr ${PYTHON_FILES}
.PHONY: lint-back-bandit

messages: ## create the .po files used for i18n
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py makemessages --keep-pot
.PHONY: messages

migrate: ## perform database migrations
	@$(COMPOSE) up -d ${DB_HOST}
	@$(WAIT_DB)
	@$(MANAGE) migrate
.PHONY: migrate

search-index: ## (re)generate the Elasticsearch index
	@$(COMPOSE) up -d ${DB_HOST}
	@$(WAIT_DB)
	@$(COMPOSE) up -d elasticsearch
	@$(WAIT_ES)
	@$(MANAGE) bootstrap_elasticsearch
.PHONY: search-index

superuser: ## Create an admin user with password "admin"
	@$(COMPOSE) up -d mysql
	@echo "Wait for services to be up..."
	@$(WAIT_DB)
	@$(MANAGE) shell -c "from django.contrib.auth.models import User; not User.objects.filter(username='admin').exists() and User.objects.create_superuser('admin', 'admin@example.com', 'admin')"
.PHONY: superuser

test-back: ## run back-end tests, or specific test like `make test-back tests/apps/core/test_web_analytics.py`
	@args="$(filter-out $@,$(MAKECMDGOALS))" && \
    DB_PORT=$(DB_PORT) bin/pytest $${args:-${1}}
.PHONY: test-back

# -- Internationalization
crowdin-download: ## download translated message from Crowdin
	@$(COMPOSE_RUN_CROWDIN) download -c crowdin/config.yml
.PHONY: crowdin-download

crowdin-upload: ## upload source translations to Crowdin
	@$(COMPOSE_RUN_CROWDIN) upload sources -c crowdin/config.yml
.PHONY: crowdin-upload

i18n-compile: ## compile translated messages to be used by all applications
i18n-compile: \
  i18n-compile-back \
  i18n-compile-front
.PHONY: i18n-compile

i18n-compile-back:
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py compilemessages
.PHONY: i18n-compile-back

i18n-compile-front:
	@$(YARN) compile-translations
.PHONY: i18n-compile-front

i18n-download-and-compile: ## download all translated messages and compile them to be used by all applications
i18n-download-and-compile: \
  crowdin-download \
  i18n-compile
.PHONY: i18n-download-and-compile

i18n-generate: ## generate source translations files for all applications
i18n-generate: \
  i18n-generate-back \
  i18n-generate-front ## generate source translations files for all applications
.PHONY: i18n-generate

i18n-generate-and-upload: ## generate source translations for all applications and upload then to crowdin
i18n-generate-and-upload: \
  i18n-generate \
  crowdin-upload
.PHONY: i18n-generate-and-upload

i18n-generate-back:
	@$(COMPOSE_RUN) -w /app/src/richie app python /app/sandbox/manage.py makemessages --ignore "venv/**/*" --keep-pot --all
.PHONY: i18n-generate-back

i18n-generate-front: build-ts
	@$(YARN) extract-translations
.PHONY: i18n-generate-front

# -- Database

dbshell: ## connect to database shell 
	docker-compose exec app python sandbox/manage.py dbshell
.PHONY: dbshell

# -- Misc
clean: ## restore repository state as it was freshly cloned
	git clean -idx
.PHONY: clean

env.d/development/common:
	cp env.d/development/common.dist env.d/development/common

env.d/development/dev:
	cp env.d/development/dev.dist env.d/development/dev

env.d/development/dev-ssl:
	cp env.d/development/dev-ssl.dist env.d/development/dev-ssl

env.d/development/crowdin:
	cp env.d/development/crowdin.dist env.d/development/crowdin

data/media/.keep:
	@echo 'Preparing media volume...'
	@mkdir -p data/media/
	@touch data/media/.keep

data/smedia/.keep:
	@echo 'Preparing secure media volume...'
	@mkdir -p data/smedia/
	@touch data/smedia/.keep

data/static/.keep:
	@echo 'Preparing static volume...'
	@mkdir -p data/static
	@touch data/static/.keep

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help
