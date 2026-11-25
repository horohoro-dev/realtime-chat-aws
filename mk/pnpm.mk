# pnpm で依存を管理する TypeScript のパッケージの入口。パッケージのディレクトリの Makefile から include する。
#   ROOT_DIR := ../
#   include $(ROOT_DIR)mk/pnpm.mk

include $(dir $(lastword $(MAKEFILE_LIST)))common.mk

PNPM ?= pnpm

setup: ## 依存を入れる（pnpm install --frozen-lockfile）
	$(call require-cmd,$(PNPM))
	$(PNPM) install --frozen-lockfile

lint: ## biome ci と tsc --noEmit
	$(PNPM) run lint
	$(PNPM) exec tsc --noEmit

fix: ## biome の整形と、安全な自動修正
	$(PNPM) run format

test: ## vitest
	$(PNPM) exec vitest run

build: ## 本番用のビルド
	$(PNPM) run build

dev: ## 開発サーバー
	$(PNPM) run dev

check: lint test ## lint とテスト

.PHONY: setup lint fix test build dev check
