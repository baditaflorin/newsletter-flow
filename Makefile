.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push hooks-post-merge

VERSION ?= v0.1.0

help:
	@printf '%s\n' \
		'make install-hooks     # wire .githooks' \
		'make dev               # run frontend dev server' \
		'make build             # build frontend into docs/ for GitHub Pages' \
		'make data              # Mode A: no static data pipeline' \
		'make test              # unit tests' \
		'make test-integration  # Mode A: no integration suite yet' \
		'make smoke             # build, preview, and run Playwright happy path' \
		'make lint              # eslint + prettier check + typecheck' \
		'make fmt               # autoformat' \
		'make pages-preview     # serve docs locally as Pages would' \
		'make release           # test, build, smoke, tag, and push semver release' \
		'make clean             # remove generated Pages assets'

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build

data:
	@printf '%s\n' 'Mode A uses browser-local user data; no static data pipeline is needed.'

test:
	npm run test

test-integration:
	@printf '%s\n' 'Mode A has no integration suite yet.'

smoke:
	npm run smoke

lint:
	npm run lint
	npm run format:check
	npm run typecheck

fmt:
	npm run format

pages-preview:
	npm run build
	npm run pages:preview -- --port 4173

release: test build smoke
	git tag $(VERSION)
	git push origin main $(VERSION)

clean:
	node scripts/clean-pages.mjs

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	@printf '%s\n' 'Usage: .githooks/commit-msg <path-to-message-file>'

hooks-pre-push:
	.githooks/pre-push

hooks-post-merge:
	.githooks/post-merge
