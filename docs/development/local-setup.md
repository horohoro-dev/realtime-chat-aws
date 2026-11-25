# 開発者の PC での動かし方

1. `docker compose up -d` で PostgreSQL を起動します。5432番がほかで使われているときは、`POSTGRES_PORT=5433 docker compose up -d` のようにポートを変え、`DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres` を環境変数で渡します。
2. `backend/` で `uv sync`、`uv run python manage.py migrate`、`uv run python manage.py runserver` を実行します。
3. pnpm は Corepack で入れます（`corepack enable`）。版は `frontend/package.json` の `packageManager` で決めます。`frontend/` で `pnpm install --frozen-lockfile`、`pnpm dev` を実行します。
   - Vite の開発サーバーは、`/api` へのリクエストを `http://localhost:8000` に転送します（`server.proxy`）。dev と prd と同じく、フロントエンドと API を同じオリジンから配信する形にして、セッション Cookie と CSRF トークンをそのまま使うためです。
4. ログインの方法は、dev 環境の Cognito ができるまでと、できたあとで変わります。
   - dev 環境ができるまで：手元だけで使う仮のログインを使います。方法は作業計画（[roadmap.md](../roadmap.md)）の Step 1 で決めます。
   - dev 環境ができたあと：IAM Identity Center で dev アカウントにログインし（`aws sso login`）、dev のユーザープールのアプリクライアント `local` のクライアントシークレットを Secrets Manager から取得して、`backend/.env` に書きます。`backend/.env` は `.gitignore` に入れてあり、コミットしません。
   - `backend/.env` には `KEY=VALUE` の形で、`OIDC_ISSUER`、`OIDC_CLIENT_ID`（アプリクライアント `local` の ID）、`OIDC_CLIENT_SECRET`、`COGNITO_DOMAIN`、`COGNITO_USER_POOL_ID` を書きます。`config/settings/local.py` が起動時に読みます。同じ名前の環境変数があれば、そちらを使います。
5. 検査とテストは、リポジトリ直下の `make lint` と `make test` で動かします。CI と同じコマンドです。
