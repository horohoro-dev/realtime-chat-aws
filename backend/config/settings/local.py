"""開発者の PC の設定。"""

import dj_database_url

from config.settings.base import *  # noqa: F403

DEBUG = True

SECRET_KEY = "local-only-secret-key-not-used-in-deployed-environments"

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# 接続先は docker-compose.yml の PostgreSQL。ポートを変えたときは DATABASE_URL で渡す
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://postgres:postgres@localhost:5432/postgres",
    ),
}
