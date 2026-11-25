ROOT_DIR := ../

include $(ROOT_DIR)mk/python.mk
include $(ROOT_DIR)mk/aws.mk

MANAGE := $(UV) run python manage.py
OPENAPI_FILE := $(REPO_ROOT)/api/openapi.yaml

db-up: ## 手元の PostgreSQL を起動する（docker compose）
	docker compose -f $(REPO_ROOT)/docker-compose.yml up -d --wait

db-down: ## 手元の PostgreSQL を止める。データは残す
	docker compose -f $(REPO_ROOT)/docker-compose.yml down

run: ## 開発サーバーを起動する（http://localhost:8000）
	$(MANAGE) runserver

migrate: ## マイグレーションを適用する
	$(MANAGE) migrate

makemigrations: .check-app ## マイグレーションを作る（例: make makemigrations APP=rooms NAME=add_rooms）
	$(MANAGE) makemigrations $(APP) $(if $(NAME),--name $(NAME))

check-migrations: ## モデルの変更に対するマイグレーションの作り忘れを検査する
	$(MANAGE) makemigrations --check --dry-run

createsuperuser: ## 手元で使う管理用ユーザーを作る
	$(MANAGE) createsuperuser

shell: ## Django のシェル
	$(MANAGE) shell

schema: ## API 定義（api/openapi.yaml）を出力する
	DJANGO_SETTINGS_MODULE=config.settings.test $(MANAGE) spectacular \
		--file $(OPENAPI_FILE) --validate --fail-on-warn

.PHONY: db-up db-down run migrate makemigrations check-migrations createsuperuser shell schema

.check-app:
	@test -n "$(APP)" || { echo "APP を指定してください。例: make makemigrations APP=rooms" >&2; exit 1; }
