# リポジトリ全体の入口。中身は各サービスの Makefile（backend/、frontend/）に任せる。
# 各サービスの Makefile は mk/ の .mk を include し、同じ名前の入口（setup、lint、fix、test）を持つ。
# CI（.github/workflows/ci.yml）と同じコマンドを手元で動かす。

ROOT_DIR := ./
include $(ROOT_DIR)mk/common.mk

SERVICES := backend frontend

setup: $(addprefix setup-,$(SERVICES)) ## すべての依存を入れる
check: lint test ## lint とテストをすべて動かす
fix: $(addprefix fix-,$(SERVICES)) ## 整形と、安全な自動修正をすべて行う。残った違反は make lint で見る
lint: $(addprefix lint-,$(SERVICES)) lint-infra ## すべての lint と型検査を動かす
test: $(addprefix test-,$(SERVICES)) ## すべてのテストを動かす

setup-backend: ## バックエンドの依存を入れる（uv）
	$(MAKE) -C backend setup
setup-frontend: ## フロントエンドの依存を入れる（pnpm）
	$(MAKE) -C frontend setup
fix-backend: ## バックエンドの整形と自動修正（ruff）
	$(MAKE) -C backend fix
fix-frontend: ## フロントエンドの整形と自動修正（biome）
	$(MAKE) -C frontend fix
lint-backend: ## バックエンドの lint（ruff）
	$(MAKE) -C backend lint
lint-frontend: ## フロントエンドの lint と型検査（biome、tsc）
	$(MAKE) -C frontend lint
test-backend: ## バックエンドのテスト（pytest）
	$(MAKE) -C backend test
test-frontend: ## フロントエンドのテスト（vitest）
	$(MAKE) -C frontend test

lint-infra: ## インフラの検査（terraform fmt、tflint）。AWS には接続しない
	@if [ -d infra ]; then \
		terraform fmt -check -recursive infra && tflint --chdir=infra --recursive; \
	else echo "infra/ がないので lint-infra を飛ばします"; fi

e2e: ## E2E テスト（Playwright）
	$(MAKE) -C frontend e2e

api: ## API 定義（api/openapi.yaml）を出力し、フロントエンドの型を作り直す
	$(MAKE) -C backend schema
	$(MAKE) -C frontend gen-api

db-up: ## 手元の PostgreSQL を起動する
	$(MAKE) -C backend db-up

labels: ## issue ループのラベルを GitHub に作る。人が gh にログインして1回だけ動かす
	gh label create loop:ready --force --color 0e8a16 --description "ループが着手してよい issue"
	gh label create loop:in-progress --force --color fbca04 --description "ループが作業中、または PR がマージ待ちの issue"
	gh label create loop:needs-human --force --color d93f0b --description "ループでは進められず、人の判断が要る"
	gh label create loop:awaiting-merge --force --color 1d76db --description "レビュー対応が済み、人のマージを待つ PR"

.PHONY: setup check fix lint test lint-infra e2e api db-up labels \
	setup-backend setup-frontend fix-backend fix-frontend \
	lint-backend lint-frontend test-backend test-frontend
