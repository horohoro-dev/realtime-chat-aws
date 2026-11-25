# 開発の決まり

リポジトリのフォルダ構成は [INDEX.md](../../INDEX.md) にあります。

## 1. ブランチの運用

| 項目 | 決まり |
|---|---|
| 既定のブランチ | main |
| 開発のブランチ | develop。作業ブランチのマージ先 |
| 作業ブランチ | develop から作り、PR で develop にマージする |
| main へのマージ | develop がまとまったところで、develop から main への PR を作ってマージする。issue は、このマージで閉じる（GitHub は既定のブランチへのマージでだけ `Fixes #` の issue を閉じる） |
| ブランチの保護 | Ruleset `protect-main-develop`（main と develop が対象）で、PR を必須にし、直接のプッシュ、強制プッシュ、ブランチの削除を禁止する。必須チェックは `ci-result` だけ |
| マージの方式 | merge コミット（「Create a merge commit」）。PR のブランチのコミットをそのまま残し、マージのコミットを1つ足す |
| マージする人 | 管理者（人）。Claude Code は PR の作成とレビュー対応までを行い、マージしない（[docs/development/loop-engineering.md](loop-engineering.md)） |

## 2. PR とレビュー

PR は [.github/pull_request_template.md](../../.github/pull_request_template.md) の項目で書きます。issue から PR までを Claude Code に進めさせる流れは [loop-engineering.md](loop-engineering.md) にあります。

## 3. 人に見せる前の検査

Claude Code が実装したコードは、整形、リント、型検査を通してから人に見せます。人が確認するのは、検査で見つからない設計と要件の点だけにするためです。書き方の決まりは [frontend-rules.md](frontend-rules.md) と [backend-rules.md](backend-rules.md) にあります。

| 順 | いつ | 何が | すること |
|---|---|---|---|
| 1 | ファイルを編集するたび | hook `.claude/hooks/lint-edited-file.py` | 編集したファイルだけを整形し（Biome か ruff）、自動で直せない違反を Claude Code に返す。Claude Code はその場で直す |
| 2 | Claude Code が応答を終える前 | hook `.claude/hooks/check-before-stop.py` | 変更のある側の検査（フロントエンドは `biome ci` と `tsc --noEmit`、バックエンドは `ruff check` と `ruff format --check`）を動かす。失敗があれば終わらせずに結果を返し、Claude Code が直す。同じセッションで5回続けて直らなければ、終了を許して人に知らせる |
| 3 | PR を出す前 | Claude Code | `make lint` と `make test` を通す。issue ループでは、続けて `code-review` スキルでレビューする（[loop-engineering.md](loop-engineering.md)） |
| 4 | PR を出したあと | CI と CodeRabbit | CI（`.github/workflows/ci.yml`）が同じ検査とテストを動かし、CodeRabbit がレビューする |
| 5 | 4 が済んだあと | 人 | PR を読み、マージする |

- hook（Claude Code がツールの実行の前後や応答の終わりに自動で動かすコマンド）の設定は `.claude/settings.json` にあります。
- 手元で整形と安全な自動修正をまとめて行うときは `make fix`、検査だけを行うときは `make lint` を使います。
- hook は、依存が入っていない側（`frontend/node_modules/` や `backend/.venv/` がない側）を飛ばします。
