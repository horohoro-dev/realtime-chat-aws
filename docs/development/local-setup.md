# 開発者の PC での動かし方

コマンドは Makefile の入口から動かします。リポジトリ直下の `make help` で全体の入口、`backend/` と `frontend/` の `make help` でそれぞれの入口を見られます。

1. 開発に使うコマンドを [mise](https://mise.jdx.dev/) で入れます。
   1. 入れたコマンドを PATH から使えるように、シェルの設定ファイルで mise を有効にします。bash なら `~/.bashrc` に `eval "$(mise activate bash)"`、zsh なら `~/.zshrc` に `eval "$(mise activate zsh)"` を書き、シェルを開き直します。エディタや CI のように対話のシェルを使わないところでは、`~/.local/share/mise/shims` を PATH に足します（[Shims](https://mise.jdx.dev/dev-tools/shims.html)）。
   2. リポジトリ直下で `mise install` を実行すると、`mise.toml` に書いた版の Node.js、Python、uv、Terraform、tflint、SOPS、age、Trivy が入ります。
   3. pnpm は Corepack で入れます。Node.js 25 からは Corepack が同梱されないので、`npm install -g corepack` で Corepack を入れてから `corepack enable` を実行します。pnpm の版は `frontend/package.json` の `packageManager` で決まります。
2. リポジトリ直下で `make setup` を実行し、バックエンドとフロントエンドの依存を入れます。
3. `make db-up` で PostgreSQL を起動します。5432番がほかで使われているときは、`POSTGRES_PORT=5433 make db-up` のようにポートを変え、`DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres` を環境変数で渡します。
4. `backend/` で `make migrate`、`make run` を実行します。
   - 独自の利用者のモデル（`accounts.User`）に切り替える前に `migrate` した DB は、`InconsistentMigrationHistory` で止まります。標準の利用者のモデルを前提にしたマイグレーション（`admin`、`auth` など）が、すでに適用されているためです。ローカルの DB には残すべきデータがないので、DB を作り直します。
     1. リポジトリ直下で `docker compose down -v` を実行します。PostgreSQL のボリュームを消します。
     2. `make db-up` で PostgreSQL を起動し直します。
     3. `make -C backend migrate` でマイグレーションを適用します。
   - `POSTGRES_PORT` を変えている場合は、`make db-up` にも同じ `POSTGRES_PORT` を付け、`DATABASE_URL` を同じポートに合わせます（手順3）。
5. `frontend/` で `make dev` を実行します。
   - Vite の開発サーバーは、`/api` へのリクエストを `http://localhost:8000` に転送します（`server.proxy`）。dev と prd と同じく、フロントエンドと API を同じオリジンから配信する形にして、セッション Cookie と CSRF トークンをそのまま使うためです。
   - 転送のときに `Host` のヘッダーを書き換えません（`changeOrigin: false`）。Django の CSRF の検査は、POST の `Origin` と `Host` が同じオリジンかを見るので、書き換えると 403 になります。
6. ログインの方法は、dev 環境の Cognito ができるまでと、できたあとで変わります。
   - dev 環境ができるまで：手元だけで使う仮のログインを使います。`make -C backend createsuperuser` か管理画面（`/admin/`）で利用者を作り、`/api/auth/login/` でログインします。ログインすると `/api/me/` に移り、ログイン中の利用者が JSON で表示されます。詳しくは [Step 1 の設計](../design/step1-app.md)の2章にあります。
   - dev 環境ができたあと：IAM Identity Center で dev アカウントにログインし（`aws sso login`）、dev のユーザープールのアプリクライアント `local` のクライアントシークレットを Secrets Manager から取得して、`backend/.env` に書きます。`backend/.env` は `.gitignore` に入れてあり、コミットしません。
   - `backend/.env` には `KEY=VALUE` の形で、`OIDC_ISSUER`、`OIDC_CLIENT_ID`（アプリクライアント `local` の ID）、`OIDC_CLIENT_SECRET`、`COGNITO_DOMAIN`、`COGNITO_USER_POOL_ID` を書きます。`config/settings/local.py` が起動時に読みます。同じ名前の環境変数があれば、そちらを使います。
7. 検査とテストは、リポジトリ直下の `make lint` と `make test` で動かします。CI と同じコマンドです。
8. E2E テスト（Playwright）は、リポジトリ直下の `make e2e` で動かします。2人の利用者が別々のブラウザのコンテキストでログインし、同じルームでメッセージを送り合うことを確かめます。
   1. 初回は `frontend/` で `pnpm exec playwright install chromium` を実行してブラウザを入れます。
   2. `make db-up` で PostgreSQL を起動しておきます。
   3. `make e2e` を実行します。Playwright（`frontend/playwright.config.ts` の `webServer`）が次の2つを起動し、テストが終わると止めます。
      - Django の開発サーバー（`http://127.0.0.1:8001`、設定は `config.settings.e2e`）。起動の前に `manage.py prepare_e2e` が、E2E の DB がなければ作り、マイグレーションを適用し、テストの利用者 `e2e-alice` と `e2e-bob` を作ります。
      - 画面をビルドして配信する `vite preview`（`http://localhost:4173`）。`/api` へのリクエストは 8001番の Django に転送します。画面と API が同じオリジンになるので、セッション Cookie と CSRF トークンがそのまま使えます。
   - E2E の DB は、開発に使う DB と分けます。既定は `postgres://postgres:postgres@localhost:5432/e2e` で、ほかの接続先は `E2E_DATABASE_URL` で渡します（例：`E2E_DATABASE_URL=postgres://postgres:postgres@localhost:5433/e2e make e2e`）。`DATABASE_URL` は E2E では使いません。
   - テストの利用者のパスワードは、公開してよいテスト用の固定の値で、`frontend/e2e/users.ts` にあります。E2E の DB のほかでは使いません。
   - `make e2e` は何度動かしても構いません。DB と利用者がすでにあれば、そのまま使います。テストが作るルームは、名前に時刻を付けて毎回別のものにします。
   - 8001番と 4173番で、すでにサーバーが動いていると、Playwright はそれをそのまま使います（CI では使わず、ポートが空いていなければ失敗します）。別の設定で動かしたサーバーが残っていると失敗するので、止めてから動かします。
   - 結果のレポートは `frontend/playwright-report/` に出ます。`frontend/` で `pnpm exec playwright show-report` を実行すると、ブラウザで見られます。
9. API を変えたら、リポジトリ直下で `make api` を実行します。`api/openapi.yaml` を出力し、フロントエンドの型（`frontend/src/api/schema.d.ts`）を作り直します。リクエストの本文は `RoomRequest`、レスポンスは `Room` のように別の型になります。

## Makefile の分け方

| ファイル | 中身 |
|---|---|
| `Makefile` | リポジトリ全体の入口。`make lint` などは、各サービスの Makefile の同じ名前の入口を呼ぶ |
| `mk/common.mk` | すべての Makefile が読み込む。`help`、`ENV` の検査（`dev` か `prd`）、コミットのハッシュ |
| `mk/python.mk`、`mk/pnpm.mk` | 言語ごとの `setup`、`lint`、`fix`、`test` |
| `mk/aws.mk` | ECR へのイメージの登録（`release-image ENV=dev`）と、Parameter Store のイメージのタグ。AWS のアカウント ID は書かず、ログイン中のプロファイルから引く |
| `backend/Makefile`、`frontend/Makefile` | 上の `.mk` を include し、サービスに固有の入口（`migrate`、`schema`、`gen-api`、`e2e` など）を足す |

サービスを足すときは、次の3つを行います。

1. そのディレクトリに Makefile を置き、先頭で `ROOT_DIR := ../` と `include $(ROOT_DIR)mk/python.mk` のように読み込みます。入口の名前は `setup`、`lint`、`fix`、`test` にそろえます。
2. リポジトリ直下の `Makefile` の `SERVICES` にサービス名を足します。
3. 同じ `Makefile` に `setup-<サービス名>`、`fix-<サービス名>`、`lint-<サービス名>`、`test-<サービス名>` の入口を足し、それぞれ `$(MAKE) -C <サービス名> <入口>` を呼びます。backend と frontend の入口と同じ形です。

2と3を忘れると、リポジトリ直下の `make test` はそのサービスを飛ばしたまま成功します。
