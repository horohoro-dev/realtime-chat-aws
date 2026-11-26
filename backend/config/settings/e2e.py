"""Playwright の E2E テストで動かす開発サーバーの設定。"""

import dj_database_url

from config.settings.local import *  # noqa: F403  設定の継承は Django の慣習
from config.settings.local import INSTALLED_APPS

INSTALLED_APPS = [*INSTALLED_APPS, "apps.e2e"]

# E2E テストはルームと利用者を作るので、開発に使う DB と分ける。
# DB がなければ manage.py prepare_e2e が作る
DATABASES = {
    "default": dj_database_url.config(
        env="E2E_DATABASE_URL",
        default="postgres://postgres:postgres@localhost:5432/e2e",
    ),
}
