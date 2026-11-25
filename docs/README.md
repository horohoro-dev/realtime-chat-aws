# 文書の目次

作成日：2026-11-25
更新日：2026-11-25

初めて読む場合は [overview.md](overview.md) から読んでください。

## 一覧

| ファイル | 内容 |
|---|---|
| [overview.md](overview.md) | このリポジトリは何か、作る機能と作らない機能 |
| [roadmap.md](roadmap.md) | Step ごとの作業計画と、各 Step の完了条件 |
| [design/architecture.md](design/architecture.md) | AWS 構成の全体像と、論点ごとの方針 |
| [adr/](adr/README.md) | 設計の判断の記録（ADR） |

作業が進んだら、次のフォルダを足します。

- `design/infra/`、`design/backend/`、`design/frontend/`、`design/cicd/`：それぞれの詳しい仕様
- `operations/`：監視、Runbook、ポストモーテム
- `development/`：開発の決まりと、ローカルでの動かし方

## 用語

| 用語 | 意味 |
|---|---|
| ルーム | チャットの部屋。メンバーだけがメッセージを読み書きできる |
| メンバー | ルームに参加している利用者 |
| メッセージ | ルームに送る文章。添付ファイルを付けられる |
| 添付ファイル | メッセージに付ける画像、動画、PDF |
| サムネイル | チャット欄に表示する、画像や動画を縮小した画像 |
| dev、prd | 開発用の環境と本番用の環境 |
