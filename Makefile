# 検査とテストの入口。CI（.github/workflows/ci.yml）と同じコマンドを手元で動かす。
# backend/、frontend/、infra/ がまだないときは、その対象を飛ばす。

.DEFAULT_GOAL := help
.PHONY: help check fix lint test api fix-backend fix-frontend lint-backend lint-frontend lint-infra test-backend test-frontend

help: ## 入口の一覧を表示する
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-15s %s\n", $$1, $$2}'

check: lint test ## lint とテストをすべて動かす

fix: fix-backend fix-frontend ## 整形と、安全な自動修正をすべて行う。残った違反は make lint で見る

fix-backend: ## バックエンドの整形と自動修正（ruff format、ruff check --fix）
	@if [ -f backend/pyproject.toml ]; then \
		cd backend && uv run ruff format . && uv run ruff check --fix .; \
	else echo "backend/ がないので fix-backend を飛ばします"; fi

fix-frontend: ## フロントエンドの整形と自動修正（biome check --write）
	@if [ -f frontend/package.json ]; then \
		cd frontend && pnpm run format; \
	else echo "frontend/ がないので fix-frontend を飛ばします"; fi

lint: lint-backend lint-frontend lint-infra ## すべての lint を動かす

test: test-backend test-frontend ## すべてのテストを動かす

api: ## API 定義（api/openapi.yaml）を出力し、フロントエンドの型を作り直す
	cd backend && DJANGO_SETTINGS_MODULE=config.settings.test uv run python manage.py spectacular --file ../api/openapi.yaml --validate --fail-on-warn
	cd frontend && pnpm run gen:api

lint-backend: ## バックエンドの lint（ruff）
	@if [ -f backend/pyproject.toml ]; then \
		cd backend && uv run ruff check . && uv run ruff format --check .; \
	else echo "backend/ がないので lint-backend を飛ばします"; fi

lint-frontend: ## フロントエンドの lint と型検査（pnpm）
	@if [ -f frontend/package.json ]; then \
		cd frontend && pnpm run lint && pnpm exec tsc --noEmit; \
	else echo "frontend/ がないので lint-frontend を飛ばします"; fi

lint-infra: ## インフラの検査（terraform fmt、tflint）。AWS には接続しない
	@if [ -d infra ]; then \
		terraform fmt -check -recursive infra && tflint --chdir=infra --recursive; \
	else echo "infra/ がないので lint-infra を飛ばします"; fi

test-backend: ## バックエンドのテスト（pytest）
	@if [ -f backend/pyproject.toml ]; then \
		cd backend && uv run pytest -n auto; \
	else echo "backend/ がないので test-backend を飛ばします"; fi

test-frontend: ## フロントエンドのテスト（vitest）
	@if [ -f frontend/package.json ]; then \
		cd frontend && pnpm exec vitest run; \
	else echo "frontend/ がないので test-frontend を飛ばします"; fi
