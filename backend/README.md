# backend

リアルタイムチャットの API（Django）です。

## 手元で動かす

リポジトリ直下で PostgreSQL を起動します。5432番がほかで使われているときは、`POSTGRES_PORT` で手元のポートを変え、`DATABASE_URL` で接続先を渡します。

```bash
docker compose up -d
```

`backend/` で依存を入れ、マイグレーションして起動します。

```bash
uv sync
```

```bash
uv run python manage.py migrate
```

```bash
uv run python manage.py runserver
```

## 設定ファイル

| ファイル | 使う場面 | 選ばれ方 |
|---|---|---|
| `config/settings/local.py` | 開発者の PC | `manage.py` の既定 |
| `config/settings/test.py` | 自動テスト | `pyproject.toml` の pytest の設定 |
| `config/settings/e2e.py` | E2E テスト（Playwright）の Django の開発サーバー。`local.py` に `apps.e2e`（`prepare_e2e` のコマンド）と E2E の DB を足す | `frontend/playwright.config.ts` の `webServer` |

## 検査とテスト

リポジトリ直下で動かします。

```bash
make lint-backend test-backend
```
