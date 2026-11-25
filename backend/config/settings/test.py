"""自動テストの設定。CI でも同じものを使う。"""

import dj_database_url

from config.settings.base import *  # noqa: F403

DEBUG = False

SECRET_KEY = "test-only-secret-key"

# 接続先は CI のサービスコンテナと docker-compose.yml の PostgreSQL。
# ポートが違うときは DATABASE_URL で渡す
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://postgres:postgres@localhost:5432/postgres",
    ),
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
