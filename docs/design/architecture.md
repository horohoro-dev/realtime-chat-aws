# 構成の全体像

作成日：2026-11-25
更新日：2026-11-25

この文書は、AWS 構成の全体像と、主な論点に対する方針をまとめたものです。決めた方針は [ADR](../adr/README.md) に理由を残します。「方針（未決定）」と書いた項目は、まだ ADR がない現時点の案です。料金に関する記述は確かめていない見込みで、作る段階で AWS の料金ページで確かめます。

## 1. 要点

- アプリは ECS on Fargate で動かし、プライベートサブネットに置きます。外への通信は NAT インスタンスが中継します。
- チャットのリアルタイム通信は WebSocket で行います。ALB が WebSocket をそのまま ECS に通し、複数のタスクの間のメッセージの配信は ElastiCache（Valkey）の Pub/Sub で行います（[ADR-0001](../adr/0001-realtime-websocket-elasticache.md)）。
- 添付ファイルは、ブラウザから S3 に直接アップロードします。アップロードを合図に Step Functions が動き、ファイルの種類ごとに Lambda でサムネイルを作ります。
- API Gateway は使いません。Lambda は Step Functions の中の処理にだけ使います。

## 2. 構成図（目標の形）

```
ブラウザ
  |  HTTPS / WebSocket
  v
Route 53 → CloudFront ＋ WAF
             |                    |
             | 画面の配信          | /api/* と /ws/*
             v                    v
   S3（フロントエンド）       ALB（パブリックサブネット、2つの AZ）
                                  |
                                  v
                    ECS on Fargate（Django。プライベートサブネット、2つの AZ）
                      |            |              |
                      v            v              v
              RDS PostgreSQL   ElastiCache    S3（添付ファイル）
              （メッセージの保存）（Pub/Sub）      |
                                                  | アップロード完了のイベント
                                                  v
                                   GuardDuty のマルウェア検査（S3）
                                                  |
                                                  v
                                   EventBridge → Step Functions
                                                  |
                                    ファイルの種類で分岐（Choice）
                                    /             |            \
                              画像の Lambda   動画の Lambda   PDF の Lambda
                              （縮小）        （1コマ切り出し） （1ページ目の画像化）
                                    \             |            /
                                     結果を API に通知 → WebSocket で画面に反映

失敗したとき：Step Functions の失敗 → EventBridge → SNS → Slack
監視：CloudWatch のアラーム → SNS → Slack
```

## 3. 論点ごとの方針

### 3.1 チャットの同期

方針（決定）：WebSocket を使い、ECS の Django（Django Channels）で受けます。複数のタスクの間の配信には ElastiCache を使います。理由とほかの案との比較は [ADR-0001](../adr/0001-realtime-websocket-elasticache.md) にあります。

最初の段階ではメッセージを数秒ごとに取りに行く方式（ポーリング）で作り、[作業計画](../roadmap.md)の Step 5 で WebSocket に置き換えます。

### 3.2 メッセージの保存と配信

方針（決定）：メッセージの保存は RDS（PostgreSQL）、配信は ElastiCache と役割を分けます（[ADR-0001](../adr/0001-realtime-websocket-elasticache.md)）。

### 3.3 添付ファイルの処理

方針（未決定）：Step Functions を使います。理由は次のとおりです。

- ファイルの種類による分岐（Choice）、複数ファイルの並列処理（Map）、失敗時の再試行（Retry）、失敗の通知（Catch）を、コードではなく定義として書けます。
- 処理の流れが AWS のコンソールで図として見えます。どこで失敗したかを説明しやすくなります。
- ECS のタスクを処理に使わないので、チャットの応答と重い処理（動画）が互いに影響しません。

ほかの案は次の2つです。

- ECS だけで処理する。Celery などのジョブの仕組みと、ワーカーのタスクとキューが要ります。
- S3 のイベントから Lambda を直接呼ぶ。分岐、並列、失敗の扱いを Lambda の中に自分で書くことになります。

### 3.4 Lambda と API Gateway

方針（未決定）：

- Lambda は、Step Functions の中のサムネイル作りに使います。動画の処理は ffmpeg が要るため、コンテナイメージの Lambda にします。動画の大きさには上限（例：100MB）を付けます。
- API Gateway は使いません。API は ALB と ECS で受けます。入口を2つにすると、認証と WAF の設定が2か所に分かれるためです。

### 3.5 ネットワーク

方針（未決定）：ECS のタスクと RDS と ElastiCache はプライベートサブネットに置きます。外への通信は、パブリックサブネットの NAT インスタンスが中継します。NAT ゲートウェイより料金を抑えるためです。prd は AZ ごとに NAT インスタンスを1台置きます。

### 3.6 マルチ AZ とバックアップ

方針（未決定）：

- ECS のタスクと NAT インスタンスは、prd では2つの AZ に置きます。
- prd の RDS はマルチ AZ にします。AWS FIS でフェイルオーバーを起こし、切り替わるまでの時間とアプリへの影響を測ります。
- ElastiCache は配信だけに使い、データを保存しません。prd は別の AZ にレプリカを置き、ノードの障害のときに自動で切り替えます。
- AWS Backup で RDS と S3 のバックアップを取ります。復元を実際に試し、手順を Runbook に書きます。

### 3.7 認証

方針（未決定）：Cognito のマネージドログインを使い、Django が OIDC で結果を受け取ります。WebSocket の接続も、同じドメインのセッションの Cookie で認証します。ルームのメンバーかどうかの判定は、Django が DB を見て行います。

### 3.8 WAF と Shield

方針（未決定）：

- WAF は CloudFront に付けます。
- Shield Standard は追加の料金なしで自動的に有効です。Shield Advanced は月額の料金が高いため使いません。

### 3.9 監視と通知

方針（未決定）：

- CloudWatch のアラーム → SNS → Amazon Q Developer in chat applications（旧 AWS Chatbot。AWS の通知を Slack に送るサービス）→ Slack の流れにします。
- 開発者に通知するもの：アラーム、Step Functions の失敗、GuardDuty の検知、デプロイの成功と失敗
- CloudWatch のダッシュボードで、WebSocket の接続数、メッセージの遅延、添付ファイルの処理時間を見ます。

### 3.10 IaC と環境

方針（決定）：AWS Organizations で、次の5つのアカウントに分けます。

| アカウント | 役割 |
|---|---|
| management | 組織の管理、SCP（組織のアカウントに一律にかける権限の制限）、IAM Identity Center（人がログインする入口） |
| security | GuardDuty、Security Hub などの検知の結果を集めて見る |
| log-archive | CloudTrail とアプリのログの写しを、消せない形で保存する |
| dev | 開発用の環境 |
| prd | 本番用の環境 |

分ける理由は次のとおりです。

- dev の操作の誤りや権限の漏れが、prd に及ばないようにします。
- ログを別のアカウントに置くことで、dev や prd の権限を持つ人でも監査の記録を消せないようにします。

方針（未決定）：Terraform は、共通のモジュールと環境ごとの設定値（envs/dev、envs/prd）に分けます。

### 3.11 CI/CD

方針（未決定）：GitHub Actions を使います。

- lint、型検査、テスト、ビルドを Matrix で並列に動かす
- terraform fmt、tflint、Trivy（設定の検査）と、terraform plan の結果の PR への投稿
- Trivy の結果を Actions の Artifact に残す
- コンテナイメージと Lambda のビルド、ECR への登録、dev への自動デプロイ、prd への承認付きのデプロイ

### 3.12 SLO と障害の試験

方針（未決定）：

- SLO（Service Level Objective。サービスの品質の目標値）の例：「メッセージの送信 API の成功率 99.5%（30日間）」「メッセージが相手の画面に届くまで 2秒以内の割合が 99%」。数値は作る段階で決めます。
- AWS FIS（Fault Injection Service。AWS が用意する、わざと障害を起こすサービス）で、ECS のタスクの停止や AZ の障害を再現します。
- 結果をポストモーテム（障害の振り返りの記録）と Runbook（対応の手順書）に残します。

## 4. 費用

方針（決定）：月額の上限は細かく決めません。かわりに、使わない時間のリソースを止めて料金を抑えます。

- 夜間と休日は、EventBridge Scheduler（決めた時刻に AWS の操作を実行するサービス）で、ECS のタスク数を 0 にし、RDS と NAT インスタンスを止めます。
- 止めている間は、CloudFront がメンテナンスのページを返します。
- RDS は止めてから7日たつと自動で起動します（要確認）。週末の停止なら7日以内に収まります。
- ElastiCache はノードを止める機能がない見込みです（要確認）。動かしたままにするか、ElastiCache Serverless にするか、時間外は削除するかを Step 5 で決めます。

マルチ AZ やバックアップなど、可用性を示すための構成は、料金を理由に省きません。
