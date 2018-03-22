# Docker
COMPOSE              = docker-compose
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_EXEC         = $(COMPOSE) exec
COMPOSE_EXEC_APP     = $(COMPOSE_EXEC) app
COMPOSE_EXEC_NODE    = $(COMPOSE_EXEC) --user="$(id -u):$(id -g)" node
COMPOSE_RUN_APP      = $(COMPOSE_RUN) app
COMPOSE_RUN_NODE     = $(COMPOSE_RUN) --user="$(id -u):$(id -g)" node
COMPOSE_TEST         = $(COMPOSE) -p fun-cms-test -f docker-compose.test.yml
COMPOSE_TEST_RUN     = $(COMPOSE_TEST) run --rm
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app

# Node
YARN                 = $(COMPOSE_RUN_NODE) yarn

# Django
MANAGE               = $(COMPOSE_RUN_APP) python manage.py

default: help

bootstrap:  ## install development dependencies
	@$(COMPOSE) build app;
	${MAKE} build-front;
	@echo 'Waiting until database is up…';
	@sleep 20;
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

lint-back: ## lint back-end python sources
	${MAKE} lint-back-flake8;
	${MAKE} lint-back-pylint;
.PHONY: lint-back

lint-back-flake8: ## lint back-end python sources with flake8
	@echo 'lint:flake8 started…';
	@$(COMPOSE_TEST_RUN_APP) flake8;
.PHONY: lint-back-flake8

lint-back-pylint: ## lint back-end python sources with pylint
	@echo 'lint:pylint started…';
	@$(COMPOSE_TEST_RUN_APP) pylint apps plugins fun_cms;
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

rebuild-test: ## rebuild the app container (test)
	@$(COMPOSE_TEST) build app
.PHONY: rebuild-test

run: ## start the development server
	@$(COMPOSE) up -d
.PHONY: run

stop: ## stop the development server
	@$(COMPOSE) stop
.PHONY: stop

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
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help

run-debug:  ## run developpment server and show output in current shell
	@$(COMPOSE) stop app;
	@$(COMPOSE_RUN) --service-ports app python manage.py runserver 0.0.0.0:8000
.PHONY: run-debug

django-shell:  ## run Django shell
	@$(MANAGE) shell
.PHONY: django-shell
