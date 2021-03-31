.DEFAULT_GOAL := help

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

dev: ## dev local server
	@wrangler dev

compile: ## transform typescript to js hat Cloudflare can run
	npm run dev

.PHONY: help
help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'
