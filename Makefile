# Docker
COMPOSE          = docker-compose
COMPOSE_RUN      = $(COMPOSE) run --rm
COMPOSE_RUN_APP  = $(COMPOSE_RUN) app
COMPOSE_RUN_NODE = $(COMPOSE_RUN) node

# Node
YARN             = $(COMPOSE_RUN_NODE) yarn

# Django
MANAGE           = $(COMPOSE_RUN_APP) python manage.py

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
	@$(COMPOSE_RUN_NODE) npm install;
	${MAKE} build-ts;
	${MAKE} build-saas;
.PHONY: build-front

build-ts: ## build TypeScript application
	@$(YARN) build
.PHONY: build-ts

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
