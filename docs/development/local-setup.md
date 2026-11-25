# 開発者の PC での動かし方

コマンドは Makefile の入口から動かします。リポジトリ直下の `make help` で全体の入口、`backend/` と `frontend/` の `make help` でそれぞれの入口を見られます。

1. 開発に使うコマンドを [mise](https://mise.jdx.dev/) で入れます。リポジトリ直下で `mise install` を実行すると、`mise.toml` に書いた版の Node.js、Python、uv、Terraform、tflint、SOPS、age、Trivy が入ります。pnpm は Corepack で入れます（`corepack enable`）。版は `frontend/package.json` の `packageManager` で決めます。
2. リポジトリ直下で `make setup` を実行し、バックエンドとフロントエンドの依存を入れます。
3. `make db-up` で PostgreSQL を起動します。5432番がほかで使われているときは、`POSTGRES_PORT=5433 make db-up` のようにポートを変え、`DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres` を環境変数で渡します。
4. `backend/` で `make migrate`、`make run` を実行します。
5. `frontend/` で `make dev` を実行します。
   - Vite の開発サーバーは、`/api` へのリクエストを `http://localhost:8000` に転送します（`server.proxy`）。dev と prd と同じく、フロントエンドと API を同じオリジンから配信する形にして、セッション Cookie と CSRF トークンをそのまま使うためです。
6. ログインの方法は、dev 環境の Cognito ができるまでと、できたあとで変わります。
   - dev 環境ができるまで：手元だけで使う仮のログインを使います。方法は作業計画（[roadmap.md](../roadmap.md)）の Step 1 で決めます。
   - dev 環境ができたあと：IAM Identity Center で dev アカウントにログインし（`aws sso login`）、dev のユーザープールのアプリクライアント `local` のクライアントシークレットを Secrets Manager から取得して、`backend/.env` に書きます。`backend/.env` は `.gitignore` に入れてあり、コミットしません。
   - `backend/.env` には `KEY=VALUE` の形で、`OIDC_ISSUER`、`OIDC_CLIENT_ID`（アプリクライアント `local` の ID）、`OIDC_CLIENT_SECRET`、`COGNITO_DOMAIN`、`COGNITO_USER_POOL_ID` を書きます。`config/settings/local.py` が起動時に読みます。同じ名前の環境変数があれば、そちらを使います。
7. 検査とテストは、リポジトリ直下の `make lint` と `make test` で動かします。CI と同じコマンドです。E2E テスト（Playwright）は `make e2e` で動かします。初回は `frontend/` で `pnpm exec playwright install chromium` を実行してブラウザを入れます。
8. API を変えたら、リポジトリ直下で `make api` を実行します。`api/openapi.yaml` を出力し、フロントエンドの型（`frontend/src/api/schema.d.ts`）を作り直します。リクエストの本文は `RoomRequest`、レスポンスは `Room` のように別の型になります。

## Makefile の分け方

| ファイル | 中身 |
|---|---|
| `Makefile` | リポジトリ全体の入口。`make lint` などは、各サービスの Makefile の同じ名前の入口を呼ぶ |
| `mk/common.mk` | すべての Makefile が読み込む。`help`、`ENV` の検査（`dev` か `prd`）、コミットのハッシュ |
| `mk/python.mk`、`mk/pnpm.mk` | 言語ごとの `setup`、`lint`、`fix`、`test` |
| `mk/aws.mk` | ECR へのイメージの登録（`release-image ENV=dev`）と、Parameter Store のイメージのタグ。AWS のアカウント ID は書かず、ログイン中のプロファイルから引く |
| `backend/Makefile`、`frontend/Makefile` | 上の `.mk` を include し、サービスに固有の入口（`migrate`、`schema`、`gen-api`、`e2e` など）を足す |

サービスを足すときは、そのディレクトリに Makefile を置き、先頭で `ROOT_DIR := ../` と `include $(ROOT_DIR)mk/python.mk` のように読み込みます。`setup`、`lint`、`fix`、`test` の名前をそろえると、リポジトリ直下の入口から呼べます。
