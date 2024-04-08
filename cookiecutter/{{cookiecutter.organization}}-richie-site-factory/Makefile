# -- Terminal colors
COLOR_INFO    = \033[0;36m
COLOR_RESET   = \033[0m

# -- Docker
DOCKER_UID           = $(shell id -u)
DOCKER_GID           = $(shell id -g)
NGINX_IMAGE_NAME     = fundocker/openshift-nginx
NGINX_IMAGE_TAG      = 1.13

COMPOSE              = \
  NGINX_IMAGE_NAME="$(NGINX_IMAGE_NAME)" \
  NGINX_IMAGE_TAG="$(NGINX_IMAGE_TAG)" \
  DOCKER_USER="$(DOCKER_UID):$(DOCKER_GID)" \
  docker compose
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app-dev
COMPOSE_EXEC         = $(COMPOSE) exec
COMPOSE_EXEC_APP     = $(COMPOSE_EXEC) app-dev
COMPOSE_TEST_RUN     = $(COMPOSE) run --rm -e DJANGO_CONFIGURATION=Test
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app-dev
WAIT_DB              = $(COMPOSE_RUN) dockerize -wait tcp://db:5432 -timeout 60s
WAIT_ES              = $(COMPOSE_RUN) dockerize -wait tcp://elasticsearch:9200 -timeout 60s
WAIT_SENTINEL        = $(COMPOSE_RUN) dockerize -wait tcp://redis-sentinel:26379 -wait tcp://redis-primary:6379 -timeout 20s

# -- Node

# We must run node with a /home because yarn tries to write to ~/.yarnrc. If the
# ID of our host user (with which we run the container) does not exist in the
# container (e.g. 1000 exists but 1009 does not exist by default), then yarn
# will try to write to "/.yarnrc" at the root of the system and will fail with a
# permission error.
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) -e HOME="/tmp" node
YARN                 = $(COMPOSE_RUN_NODE) yarn

# -- Django
MANAGE = $(COMPOSE_RUN_APP) python manage.py

# -- Rules
default: help

bootstrap: \
  .env \
  env.d/aws \
  env.d/development \
  data/media/$(RICHIE_SITE)/.keep \
  data/db/$(RICHIE_SITE) \
  stop \
  build-front \
  build \
  i18n \
  run \
  migrate \
  init
bootstrap:  ## install development dependencies
.PHONY: bootstrap

generate-site: ## generate a new site using cookiecutter
	@docker run --rm -it -e LC_ALL=C.UTF-8 \
		-u $(DOCKER_UID):$(DOCKER_GID) \
		-v $(PWD):/app \
		-v $(PWD)/.cookiecutter_replay:/.cookiecutter_replay \
		-w /app \
		cookiecutter/cookiecutter \
			--output-dir /app/sites \
			--config-file /app/.cookiecutter_default.yml \
			/app/template
.PHONY: generate-site

add-site: generate-site ## add a new site to the site factory
	@echo "RICHIE_SITE=$(shell ls -td sites/* | head -1 | cut -f2 -d'/')" > .env
.PHONY: add-site

.env: ## site should be activated
	@bin/activate

# == Docker
build: .env ## build all containers
	$(COMPOSE) build app
	$(COMPOSE) build nginx
	$(COMPOSE) build app-dev
.PHONY: build

reset: .env ## Remove database and local files
	$(COMPOSE) stop
	rm -Ir data/* || exit 0
	$(COMPOSE) rm db
.PHONY: reset

down: .env ## stop & remove containers
	@$(COMPOSE) down
.PHONY: down

logs: .env ## display app logs (follow mode)
	@$(COMPOSE) logs -f app-dev
.PHONY: logs

run: .env ## start the wsgi (production) or development server
	@$(COMPOSE) up -V -d redis-sentinel
	@$(WAIT_SENTINEL)
	@$(COMPOSE) up -d nginx
	@$(COMPOSE) up -d app-dev
	@$(WAIT_DB)
.PHONY: run

stop: .env ## stop the development server
	@$(COMPOSE) stop
.PHONY: stop

info: .env ## get activated site info
	@cat .env
.PHONY: info

# == Frontend
build-front: install-front build-ts build-sass ## build front-end application
.PHONY: build-front

build-sass: .env ## build Sass files to css
	@$(YARN) build-sass
.PHONY: build-sass

build-sass-production: .env ## build Sass files to css (production mode)
	@$(YARN) build-sass-production
.PHONY: build-sass-production

build-ts: .env ## build ts(x) files to js
	@$(YARN) build-ts
.PHONY: build-ts

build-ts-production: .env ## build ts(x) files to js (production mode)
	@$(YARN) build-ts-production
.PHONY: build-ts-production

install-front: .env ## install front-end dependencies
	@$(YARN) install
.PHONY: install-front

install-front-production: .env ## install front-end dependencies (production mode)
	@$(YARN) install --frozen-lockfile
.PHONY: install-front-production

lint-front-prettier: .env ## run prettier linter over ts(x) & scss files
	@$(YARN) prettier
.PHONY: lint-front-prettier

lint-front-prettier-write: .env ## run prettier over ts(x) & scss files -- beware! overwrites files
	@$(YARN) prettier-write
.PHONY: lint-front-prettier-write

lint-front-eslint: .env ## run eslint over ts files
	@$(YARN) lint
.PHONY: lint-front-eslint

lint-front: ## run all linters frontend on sources
lint-front: \
	lint-front-prettier-write \
	lint-front-eslint
.PHONY: lint-front

test-back: .env ## run back-end tests
	bin/pytest
.PHONY: test-back

watch-sass: .env ## watch changes in Sass files
	@$(YARN) watch-sass
.PHONY: watch-sass

watch-ts: .env ## watch changes in js files
	@$(YARN) watch-ts
.PHONY: watch-ts

# == AWS/Terraform
env.d/aws:
	cp env.d/aws.dist env.d/aws

# == Django
check: .env ## perform django checks
	@$(MANAGE) check
.PHONY: check

demo-site: .env ## create a demo site
	@$(COMPOSE) up -d db
	@$(WAIT_DB)
	@$(MANAGE) flush
	@$(MANAGE) create_demo_site
	@${MAKE} search-index
.PHONY: demo-site

init: .env ## create base site structure
	@$(MANAGE) richie_init
	@${MAKE} search-index
.PHONY: init

# Nota bene: Black should come after isort just in case they don't agree...
lint-back: ## lint back-end python sources
lint-back: \
  lint-back-isort \
  lint-back-black \
  lint-back-flake8 \
  lint-back-pylint \
  lint-back-bandit \
  lint-back-raincoat
.PHONY: lint-back

lint-back-black: .env ## lint back-end python sources with black
	@echo 'lint:black started…'
	@$(COMPOSE_TEST_RUN_APP) black .
.PHONY: lint-back-black

lint-back-flake8: .env ## lint back-end python sources with flake8
	@echo 'lint:flake8 started…'
	@$(COMPOSE_TEST_RUN_APP) flake8
.PHONY: lint-back-flake8

lint-back-isort: .env ## automatically re-arrange python imports in back-end code base
	@echo 'lint:isort started…'
	@$(COMPOSE_TEST_RUN_APP) isort --atomic .
.PHONY: lint-back-isort

lint-back-pylint: .env ## lint back-end python sources with pylint
	@echo 'lint:pylint started…'
	@$(COMPOSE_TEST_RUN_APP) pylint .
.PHONY: lint-back-pylint

lint-back-raincoat: .env ## lint back-end python sources with raincoat
	@echo 'lint:raincoat started…'
	@$(COMPOSE_TEST_RUN_APP) raincoat
.PHONY: lint-back-raincoat

lint-back-bandit: .env ## lint back-end python sources with bandit
	@echo 'lint:bandit started…'
	@$(COMPOSE_TEST_RUN_APP) bandit -qr .
.PHONY: lint-back-bandit

import-fixtures: .env ## import fixtures
	@$(MANAGE) import_fixtures -v3
.PHONY: import-fixtures

i18n: ## create/update translation files then compile them for both frontend and backend
i18n: \
	i18n-back \
	i18n-front
.PHONY: i18n

i18n-back: .env ## create/update .po files and compile .mo files used for i18n
	@$(MANAGE) makemessages --keep-pot --all
	@echo 'Reactivating obsolete strings (allow overriding strings defined in dependencies)'
	@$(COMPOSE_RUN_APP) find ./ -type f -name django.po -exec sed -i 's/#~ //g' {} \;
	@$(MANAGE) compilemessages
.PHONY: i18n-back

i18n-front: .env ## Extract and compile translation files used for react-intl
	@$(YARN) extract-translations
	@$(YARN) compile-translations
.PHONY: i18n-front

migrate: .env ## perform database migrations
	@$(COMPOSE) up -d db
	@$(WAIT_DB)
	@$(MANAGE) migrate
.PHONY: migrate

search-index: .env ## (re)generate the Elasticsearch index
	@$(COMPOSE) up -d elasticsearch
	@$(WAIT_ES)
	@$(MANAGE) bootstrap_elasticsearch
.PHONY: search-index

superuser: .env ## create a DjangoCMS superuser
	@$(COMPOSE) up -d db
	@$(WAIT_DB)
	@$(MANAGE) createsuperuser
.PHONY: superuser

# == CI
ci-check: .env ## run django check management command on productin image
	$(COMPOSE_RUN) app python manage.py check
.PHONY: ci-check

ci-migrate: .env ## run django migrate command on production image
	@$(COMPOSE) up -d db
	@$(WAIT_DB)
	$(COMPOSE_RUN) app python manage.py migrate
.PHONY: ci-migrate

ci-run: .env ## start the wsgi server (and linked services)
	@$(COMPOSE) up -d app
	# As we use a remote docker environment, we should explicitly use the same
	# network to check containers status
	@echo "Wait for services to be up..."
	docker run --network container:fun_db_1 --rm jwilder/dockerize -wait tcp://localhost:5432 -timeout 60s
	docker run --network container:fun_elasticsearch_1 --rm jwilder/dockerize -wait tcp://localhost:9200 -timeout 60s
.PHONY: ci-run

ci-version: .env ## check version file bundled in the docker image
	$(COMPOSE_RUN) --no-deps app cat version.json
.PHONY: ci-version

# == Misc
clean: ## restore repository state as it was freshly cloned
	git clean -idx
.PHONY: clean

data/media/$(RICHIE_SITE)/.keep: .env
	@echo 'Preparing media volume...'
	@mkdir -p data/media/$(RICHIE_SITE)
	@touch data/media/$(RICHIE_SITE)/.keep

data/db/$(RICHIE_SITE): .env
	@echo 'Preparing db volume...'
	@mkdir -p data/db/$(RICHIE_SITE)

env.d/development:
	cp env.d/development.dist env.d/development

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help
