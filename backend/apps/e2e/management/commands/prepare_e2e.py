"""E2E テストの前に、DB、マイグレーション、テストの利用者をそろえる。

何度動かしてもよい。DB と利用者がすでにあれば、そのまま使う。利用者のパスワードは毎回
指定の値にし直す。
"""

from collections.abc import Iterable
from typing import Any

import psycopg
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandParser
from django.db import connection
from psycopg import sql

# CREATE DATABASE を発行するときに接続する、PostgreSQL に初めからある DB
MAINTENANCE_DATABASE = "postgres"


def create_database_if_missing() -> bool:
    """接続先の DB がなければ作る。作ったら True を返す。"""
    db = connection.settings_dict
    with psycopg.connect(
        dbname=MAINTENANCE_DATABASE,
        user=db["USER"] or None,
        password=db["PASSWORD"] or None,
        host=db["HOST"] or None,
        port=db["PORT"] or None,
        autocommit=True,
        **db["OPTIONS"],
    ) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", [db["NAME"]]
        ).fetchone()
        if exists is not None:
            return False
        conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db["NAME"])))
        return True


def ensure_users(usernames: Iterable[str], password: str) -> None:
    """利用者がいなければ作り、いればパスワードだけを指定の値にする。"""
    user_model = get_user_model()
    for username in usernames:
        user, _ = user_model.objects.get_or_create(username=username)
        user.set_password(password)
        user.save(update_fields=["password"])


class Command(BaseCommand):
    help = "E2E テストの DB を作ってマイグレーションを適用し、テストの利用者を作る"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("usernames", nargs="+", help="作る利用者の名前")
        parser.add_argument(
            "--password",
            required=True,
            help="利用者のパスワード。公開してよいテスト用の値だけを渡す",
        )

    def handle(self, *_args: Any, **options: Any) -> None:
        if create_database_if_missing():
            self.stdout.write(f"DB {connection.settings_dict['NAME']} を作りました")
        call_command("migrate", interactive=False, verbosity=options["verbosity"])
        ensure_users(options["usernames"], options["password"])
        self.stdout.write(f"利用者を用意しました: {', '.join(options['usernames'])}")
