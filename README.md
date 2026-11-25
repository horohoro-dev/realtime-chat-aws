# realtime-chat-aws

作成日：2026-11-25
更新日：2026-11-25

ルーム（チャットの部屋）の中で、メッセージと画像・動画・PDF を送り合えるチャットサービスを、AWS 上に作るリポジトリです。主題はインフラ、CI/CD、セキュリティ、運用です。フロントエンドとバックエンドは、インフラの上で動かすための最小限にしています。

- 初めて読む方は [docs/overview.md](docs/overview.md) から読んでください。何を作り、何を作らないかをまとめています。
- AWS 構成の全体像は [docs/design/architecture.md](docs/design/architecture.md)、構成を選んだ理由は [docs/adr/](docs/adr/README.md) にあります。
- 文書の一覧と用語表は [docs/README.md](docs/README.md)、リポジトリのフォルダ構成は [INDEX.md](INDEX.md) にあります。

## 今の段階

作業計画（[docs/roadmap.md](docs/roadmap.md)）の Step 0（リポジトリの準備）です。リポジトリにあるのは次のものです。

- 検査とテストの入口（Makefile）
- GitHub Actions の CI、Dependabot、issue と PR のテンプレート
- Claude Code の設定と skill
- 構成の全体像、作業計画、ADR

## 目標の構成

```
ブラウザ → CloudFront ＋ WAF → ALB → ECS on Fargate（Django、2つの AZ）
                                          ├─ RDS for PostgreSQL（メッセージの保存）
                                          ├─ ElastiCache（タスクの間のメッセージの配信）
                                          └─ S3（添付ファイル）→ Step Functions ＋ Lambda（サムネイル）
```

詳しくは [docs/design/architecture.md](docs/design/architecture.md) にあります。

## 開発の始め方

1. [docs/development/local-setup.md](docs/development/local-setup.md) の手順で、開発者の PC で動かします。
2. `make help` で、検査とテストの入口の一覧を見られます。

ブランチと PR の決まりは [docs/development/contributing.md](docs/development/contributing.md) にあります。

| 種類 | 使うもの |
|---|---|
| バックエンド | Python、Django、Django REST framework、uv |
| フロントエンド | TypeScript、React、Vite、React Aria Components、Tailwind CSS、pnpm |
| インフラ | Terraform、AWS |
| CI/CD | GitHub Actions |

## ライセンス

- コードと文書は [MIT](LICENSE) です。
- ほかのリポジトリから取り込んだファイルは、それぞれ元のライセンスのままです。場所とライセンスは [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) にあります。
