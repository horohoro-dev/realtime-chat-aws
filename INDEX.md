# リポジトリのフォルダ構成

作成日：2026-11-25
更新日：2026-11-25

このリポジトリのフォルダ構成です。文書の目次は [docs/README.md](docs/README.md) にあります。

（予定）はこれから作るものです。

```
realtime-chat-aws/
├── README.md                     # 概要と、文書・構成・開発の始め方への入口
├── INDEX.md                      # このファイル
├── LICENSE                       # MIT
├── THIRD_PARTY_NOTICES.md        # 取り込んだファイルのライセンス
├── CLAUDE.md                     # Claude Code と人が守る決まり（言語、公開してよい内容、コメント、UI、ライセンス）
├── Makefile                      # 検査とテストの入口。make help で一覧。CI と同じコマンド
├── docker-compose.yml            # 開発者の PC で使う PostgreSQL
├── .editorconfig                 # 文字コード、改行、インデント
├── .gitignore                    # 秘密情報、tfstate、ビルドの生成物
├── .coderabbit.yaml              # CodeRabbit のレビューの設定
│
├── .claude/
│   ├── settings.json             # 許可と拒否のコマンド、フック
│   ├── hooks/
│   │   ├── session-start.sh      # クラウドセッションで uv と pnpm の依存を入れ、CodeRabbit CLI にログインする
│   │   ├── check-history-comments.py  # 経緯を書いたコメントを指摘する
│   │   ├── lint-edited-file.py   # 編集したファイルを整形し、残った lint の違反を返す
│   │   └── check-before-stop.py  # 応答を終える前に lint と型検査を動かし、失敗なら直させる
│   └── skills/                   # issue-loop、tasks-to-issues と、取り込んだ skill
│
├── docs/
│   ├── README.md                 # 文書の目次と用語表
│   ├── overview.md               # 概要。初めて読む人向け
│   ├── roadmap.md                # Step ごとの作業計画
│   ├── adr/                      # ADR。README.md に一覧と書き方
│   ├── design/
│   │   └── architecture.md       # AWS 構成の全体像と、論点ごとの方針
│   ├── development/
│   │   ├── contributing.md       # ブランチの運用、PR とレビュー、人に見せる前の検査
│   │   ├── frontend-rules.md     # React などの書き方の決まりと、Biome のルールの意図
│   │   ├── backend-rules.md      # Python の書き方の決まりと、ruff のルールの意図
│   │   ├── local-setup.md        # 開発者の PC での動かし方
│   │   └── loop-engineering.md   # issue から PR までを Claude Code に進めさせる仕組み
│   └── operations/               # （予定）監視、Runbook、ポストモーテム
│
├── api/                          # （予定）
│   └── openapi.yaml              # API 定義。バックエンドが出力し、フロントエンドが型を生成する（make api）
│
├── backend/                      # （予定）Django。uv で依存を管理する
│   ├── pyproject.toml、uv.lock
│   ├── manage.py
│   ├── config/settings/          # base.py、local.py、test.py、deployed.py
│   ├── apps/                     # accounts（Cognito でのログイン）、common（共通の部品）
│   └── tests/
│
├── frontend/                     # （予定）React、TypeScript、Vite。pnpm で依存を管理する
│   ├── package.json              # packageManager で pnpm の版を決める
│   ├── pnpm-lock.yaml
│   ├── .nvmrc                    # Node.js の版
│   ├── biome.json                # 整形とリントの設定（docs/development/frontend-rules.md）
│   ├── biome-plugins/            # Biome の独自ルール（GritQL）
│   ├── vite.config.ts
│   └── src/
│
├── infra/                        # （予定）Terraform
│
└── .github/
    ├── ISSUE_TEMPLATE/task.yml   # issue ループの単位になる issue の項目
    ├── pull_request_template.md  # PR の項目。1行目が Fixes #
    ├── CODEOWNERS                # .github/、.claude/、infra/、deploy/ は管理者のレビューを必須にする
    ├── dependabot.yml            # 依存ライブラリの更新
    ├── scripts/trivy-summary.jq  # Trivy の結果を、ジョブの概要の表にする
    └── workflows/
        └── ci.yml                # PR の検査。changes で変更を判定し、必要なジョブだけ並列に動かす
```

`planning/` は、まだ決めていない論点と、決めたことの記録です。固まった内容は `docs/` に移します。

## 置き場所の決まり

- 設計を変えるときは、`docs/design/` の該当するファイルを直します。決定の理由が変わるときは、`docs/adr/` に新しい ADR を足します。
- 運用の手順は `docs/operations/`、開発の進め方は `docs/development/` に置きます。
- コードを入れたら、この INDEX.md の（予定）の印を外します。
