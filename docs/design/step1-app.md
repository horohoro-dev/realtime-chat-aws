# Step 1 のアプリの設計

作成日：2026-11-25

[作業計画](../roadmap.md)の Step 1（アプリの最小限）で作るものの仕様です。ローカルで、2つのブラウザから同じルームにメッセージを送り合えるところまでを作ります。

## 1. 範囲

作るもの：

- 仮のログイン（Django のユーザーとセッション）
- ルームの作成と一覧
- ルームへのメンバーの招待
- ルームの中でのメッセージの送受信。新しいメッセージは3秒ごとのポーリングで取ります
- 画面は3つ：ルームの一覧、ルームの作成、チャット

作らないもの：

- 画面の装飾、検索、既読、通知、メッセージの編集と削除
- ルームからの退出、メンバーの削除、ルームの削除
- 添付ファイル（Step 6）、WebSocket（Step 5）、Cognito（Step 3）
- 古いメッセージを遡って読むこと。チャット画面には最新の50件だけを出します

## 2. 仮のログイン

Step 3 で Cognito に置き換えるまでの仮の仕組みです。画面は作らず、Django にある部品で済ませます。

- ログインの画面は、DRF のログインの画面（`rest_framework.urls`）を `/api/auth/` に置いて使います。URL は `/api/auth/login/` と `/api/auth/logout/` です。`/api/` の下に置くので、Vite の開発サーバーのプロキシの設定（`/api`）をそのまま使えます。
- ログインするとセッションの Cookie が付きます。API の認証は DRF の `SessionAuthentication` だけにし、既定で全 API にログインを求めます（`IsAuthenticated`）。
- 書き込みの API（POST）には CSRF トークンが要ります。フロントエンドは Cookie の `csrftoken` を読み、`X-CSRFToken` のヘッダーで送ります。この処理は `src/api/client.ts` に置きます。
- 利用者は `make -C backend createsuperuser` と、管理画面（`/admin/`）で作ります。
- 未ログインで API を呼ぶと 403 が返ります。フロントエンドは `GET /api/me/` が 403 のとき、ログインの画面へのリンクを `Alert` で出します。

利用者のモデルは、最初から独自のもの（`accounts.User`。`AbstractUser` を継承し、項目は足さない）にします。Django の公式の文書が、プロジェクトの開始時に独自の利用者のモデルにすることを勧めているためです。あとから変えると、マイグレーションの作り直しが要ります。Step 3 で Cognito の利用者の ID を持たせるときも、このモデルに項目を足します。

すでにマイグレーションを実行したローカルの DB には、Django の標準の利用者のモデルを前提にしたマイグレーション（`admin`、`auth` など）が適用されています。独自の利用者のモデルに切り替えたあとにこの DB でマイグレーションを実行すると、Django が `InconsistentMigrationHistory` で止まります。ローカルの DB には残すべきデータがないので、切り替えるときは DB を作り直します（リポジトリの直下で `docker compose down -v` を実行して PostgreSQL のボリュームを消してから、`make db-up` と `make -C backend migrate`）。`POSTGRES_PORT` でポートを変えている場合は、`make db-up` にも同じ `POSTGRES_PORT` を付け、`DATABASE_URL` を同じポートに合わせます（[ローカルでの動かし方](../development/local-setup.md)の手順3）。この手順は `docs/development/local-setup.md` にも書きます。

## 3. モデル

Django のアプリは `backend/apps/` の下に置きます。

| アプリ | モデル | 内容 |
|---|---|---|
| `apps.accounts` | `User` | 利用者。`AbstractUser` のまま |
| `apps.rooms` | `Room` | ルーム |
| `apps.rooms` | `Membership` | ルームとメンバーの組 |
| `apps.rooms` | `Message` | メッセージ |

### 3.1 Room

| 項目 | 型 | 決まり |
|---|---|---|
| `id` | BigAutoField | |
| `name` | CharField | 1〜50文字。前後の空白は除く。同じ名前のルームがあってもよい |
| `created_by` | ForeignKey(User) | 作った人。`on_delete=PROTECT` |
| `created_at` | DateTimeField | 作った日時（`auto_now_add`） |

### 3.2 Membership

| 項目 | 型 | 決まり |
|---|---|---|
| `id` | BigAutoField | |
| `room` | ForeignKey(Room) | `on_delete=CASCADE` |
| `user` | ForeignKey(User) | `on_delete=CASCADE` |
| `joined_at` | DateTimeField | 加わった日時（`auto_now_add`） |

- `room` と `user` の組は一意にします（`UniqueConstraint`）。
- ルームを作った人は、作ると同時にメンバーになります。ルームの作成とメンバーの登録は1つのトランザクションで行います。
- メンバーに役割（管理者など）はありません。メンバーならだれでも招待できます。

### 3.3 Message

| 項目 | 型 | 決まり |
|---|---|---|
| `id` | BigAutoField | |
| `room` | ForeignKey(Room) | `on_delete=CASCADE` |
| `sender` | ForeignKey(User) | 送った人。`on_delete=PROTECT` |
| `body` | TextField | 1〜2000文字。前後の空白は除く |
| `created_at` | DateTimeField | 送った日時（`auto_now_add`） |

- `room` と `id` の組に索引を張ります。ルームの最新のメッセージを取る問い合わせに使います。

## 4. API

すべて `/api/` の下に置き、ログインを求めます。応答は JSON です。スキーマは drf-spectacular で `api/openapi.yaml` に出し、フロントエンドの型（`src/api/schema.d.ts`）を生成します（`make api`）。

| メソッドと URL | 内容 | 成功 |
|---|---|---|
| `GET /api/me/` | ログイン中の利用者 | 200 |
| `GET /api/rooms/` | 自分がメンバーのルームの一覧。新しく作られた順 | 200 |
| `POST /api/rooms/` | ルームを作る。作った人がメンバーになる | 201 |
| `GET /api/rooms/{room_id}/` | ルームの詳細 | 200 |
| `GET /api/rooms/{room_id}/members/` | メンバーの一覧。加わった順 | 200 |
| `POST /api/rooms/{room_id}/members/` | 利用者名でメンバーを招待する | 201 |
| `GET /api/rooms/{room_id}/messages/` | 最新の50件のメッセージ。古い順に並べる | 200 |
| `POST /api/rooms/{room_id}/messages/` | メッセージを送る | 201 |

### 4.1 本文と応答の形

```text
User       { id, username }
Room       { id, name, created_by: User, created_at }
RoomRequest    { name }
Member     { user: User, joined_at }
MemberRequest  { username }
Message    { id, sender: User, body, created_at }
MessageRequest { body }
```

一覧はページ分けをせず、配列で返します。日時は ISO 8601 の文字列です。

### 4.2 失敗のときの応答

| 場合 | 状態コード |
|---|---|
| 未ログイン | 403 |
| ルームがない。または自分がそのルームのメンバーでない | 404 |
| 入力の誤り（名前や本文が空、長すぎる） | 400 |
| 招待する利用者がいない | 400（`username` の項目の誤り） |
| 招待する利用者がすでにメンバー | 400（`username` の項目の誤り） |

メンバーでないルームに 403 ではなく 404 を返すのは、ルームがあるかどうかを、メンバーでない人に知らせないためです。

本文の形は DRF の既定のまま（`{"detail": "..."}`、または `{"項目名": ["..."]}`）にします。

## 5. 画面

React Router でルートを分けます。部品は React Aria Components と Tailwind CSS で作り、通知はトーストではなくインラインの `Alert` で出します。

| URL | 画面 | 内容 |
|---|---|---|
| `/` | ルームの一覧 | 自分がメンバーのルームの一覧。各ルームへのリンクと、作成の画面へのリンク |
| `/rooms/new` | ルームの作成 | 名前を入れて作る。作ったらそのルームのチャットの画面へ移る |
| `/rooms/:roomId` | チャット | メッセージの一覧と送信の欄。メンバーの一覧と招待の欄 |

- どの画面でも、まず `GET /api/me/` でログインを確かめます。403 なら、ログインの画面（`/api/auth/login/?next=` に今の URL を付けたもの）へのリンクを `Alert` で出します。
- チャットの画面は、メッセージの一覧のクエリを3秒ごとに取り直します（TanStack Query の `refetchInterval`）。送信が成功したら、そのクエリを無効にして取り直します。
- ルームがない、またはメンバーでない（404）ときは、「ルームが見つかりません」と一覧へのリンクを出します。
- 入力の誤り（400）は、該当する入力欄の下にメッセージを出します。

API の呼び出しは `src/api/client.ts`（openapi-fetch）にまとめ、クエリとミューテーションは `src/api/queries/` に機能ごとのフックとして書きます（[フロントエンドの書き方の決まり](../development/frontend-rules.md)の3章）。

## 6. テスト

| 対象 | 道具 | 確かめること |
|---|---|---|
| API | pytest と pytest-django | 各 API の成功の応答。未ログインで 403。メンバーでないと 404。入力の誤りで 400 |
| 画面 | Vitest、Testing Library、MSW | 各画面の表示、送信、エラーのときの `Alert` |
| 全体 | Playwright | 2人の利用者が、別々のブラウザのコンテキストから同じルームにメッセージを送り合える |

Playwright の全体のテストは、バックエンドと PostgreSQL を動かして行います。CI でも動かすため、ワークフローの e2e のジョブに PostgreSQL のサービスコンテナと Django の起動を足します。

## 7. 作業の分け方

1つの PR で終わる大きさに分けた案です。issue にするときは `/tasks-to-issues` を使います。

| # | 作業 | 依存 |
|---|---|---|
| 1 | 独自の利用者のモデル（`apps.accounts`）、`/api/auth/` のログイン、`GET /api/me/`、認証と権限の既定値、ローカルの DB を作り直す手順 | なし |
| 2 | `apps.rooms` の3つのモデル、マイグレーション、管理画面への登録 | 1 |
| 3 | ルームの API（一覧、作成、詳細） | 2 |
| 4 | メンバーの API（一覧、招待） | 3 |
| 5 | メッセージの API（最新の50件、送信） | 3 |
| 6 | フロントエンドの足場：`src/api/client.ts`（CSRF トークン）、QueryClient、React Router、ログインの確認と未ログインの `Alert` | 1 |
| 7 | ルームの一覧と作成の画面 | 3、6 |
| 8 | チャットの画面（メッセージの一覧のポーリングと送信） | 5、6 |
| 9 | チャットの画面のメンバーの一覧と招待 | 4、8 |
| 10 | Playwright の2人のやり取りのテストと、CI の e2e のジョブへのバックエンドの追加 | 7、8、9 |

API の issue（3〜5）では、`make api` で `api/openapi.yaml` と `src/api/schema.d.ts` も更新します。
