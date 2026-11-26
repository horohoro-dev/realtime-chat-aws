ROOT_DIR := ../

include $(ROOT_DIR)mk/pnpm.mk

gen-api: ## api/openapi.yaml から API の型（src/api/schema.d.ts）を作る
	$(PNPM) run gen:api

check-api: ## コミットされた src/api/schema.d.ts が api/openapi.yaml と合っているかを検査する
	$(PNPM) run check:api

e2e: ## Playwright の E2E テスト。Django の開発サーバーと、ビルドした画面の vite preview を起動して動かす
	$(PNPM) run e2e

.PHONY: gen-api check-api e2e
