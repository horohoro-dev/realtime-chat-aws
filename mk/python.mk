# uv で依存を管理する Python のサービスの入口。サービスのディレクトリの Makefile から include する。
#   ROOT_DIR := ../
#   include $(ROOT_DIR)mk/python.mk

include $(dir $(lastword $(MAKEFILE_LIST)))common.mk

UV ?= uv
PYTEST_ARGS ?= -n auto

setup: ## 依存を入れる（uv sync --frozen）
	$(call require-cmd,$(UV))
	$(UV) sync --frozen

lint: ## ruff check と ruff format --check
	$(UV) run ruff check .
	$(UV) run ruff format --check .

fix: ## ruff format と、安全な自動修正（ruff check --fix）
	$(UV) run ruff format .
	$(UV) run ruff check --fix .

test: ## pytest。引数は PYTEST_ARGS で渡す（例: make test PYTEST_ARGS="-k room -x"）
	$(UV) run pytest $(PYTEST_ARGS)

check: lint test ## lint とテスト

.PHONY: setup lint fix test check
