# 作業計画

作成日：2026-11-25

## 1. 進め方

大きく4つの段階に分けます。

1. アプリの最小限を作る（Step 0〜1）
2. CI/CD とインフラの土台を作り、AWS で動かす（Step 2〜4）
3. 機能を1つ足すたびにインフラも変える（Step 5〜6）
4. 運用を作り込み、見せる資料を仕上げる（Step 7〜9）

各 Step は「完了条件」を満たしたら次に進みます。完了条件は、README と文書で説明できる形になっているかを基準にしています。

各 Step の期間は決めていません。Step 1 を終えた時点で、かかった時間から残りを見積もります。

## 2. Step の一覧

| Step | 内容 | インフラの変化 |
|---|---|---|
| 0 | リポジトリの準備 | なし |
| 1 | アプリの最小限（ローカルで動く） | なし（docker compose） |
| 2 | CI | なし（GitHub Actions） |
| 3 | dev 環境の構築と CD | VPC、NAT、ECS、ALB、RDS、CloudFront、S3、Cognito |
| 4 | prd 環境とセキュリティの土台 | マルチ AZ、WAF、バックアップ、監査 |
| 5 | リアルタイム化 | ElastiCache、ALB の WebSocket |
| 6 | 添付ファイル | S3、GuardDuty、EventBridge、Step Functions、Lambda |
| 7 | 監視と通知 | CloudWatch、SNS、Slack |
| 8 | SLO と障害の試験 | AWS FIS |
| 9 | 仕上げ | なし |

## 3. 各 Step の中身

### Step 0：リポジトリの準備

- Makefile、CI、Claude Code の設定を用意します。
- README、CLAUDE.md、INDEX.md を書きます。
- 設計の詳しい仕様と ADR は、使う Step で書きます。

完了条件：`make lint` と `make test` が通る。

### Step 1：アプリの最小限

- Django と Vite の公式の雛形から `backend/` と `frontend/` を作り、lint の設定（Ruff、Biome、TypeScript）を入れます。
- ルームの作成と一覧、メンバーの招待、ルームの中でのメッセージの送受信（数秒ごとのポーリング）
- ローカルでは仮のログイン（Django の管理用ユーザー）で済ませます
- 画面は3つ：ルームの一覧、ルームの作成、チャット
- 作り込まないこと：画面の装飾、検索、既読、通知、編集と削除

完了条件：ローカルで2つのブラウザから同じルームにメッセージを送り合える。テストがある。

### Step 2：CI

- lint、型検査、テスト、ビルドを Matrix で並列に動かす
- Trivy と Dependabot の脆弱性検査。結果を Actions の Artifact に残す
- コンテナイメージのビルドの検査

完了条件：PR を出すと全検査が動き、必須チェックが通らないとマージできない。

### Step 3：dev 環境と CD

- AWS Organizations と5つのアカウント、SCP、IAM Identity Center、組織の CloudTrail
- Terraform の土台（tfstate の S3、GitHub Actions の OIDC の IAM ロール）
- VPC、NAT インスタンス、ECS on Fargate、ALB、RDS、CloudFront と S3（画面の配信）、Cognito、Route 53 と ACM
- CD：main にマージしたら dev へデプロイ。terraform plan の結果を PR に出す
- 夜間と休日の停止

完了条件：dev のドメインで Cognito でログインし、チャットができる。インフラの変更が PR から plan と apply まで流れる。

### Step 4：prd 環境とセキュリティの土台

- prd 環境。同じモジュールを設定値だけ変えて使う
- マルチ AZ（ECS、NAT インスタンス。RDS をマルチ AZ にするかは Step 4 の前に決める）
- WAF、AWS Backup、CloudTrail、GuardDuty、Security Hub
- dev から prd への昇格（承認付きのデプロイ）

完了条件：prd で動く。バックアップから復元を1回試し、手順を Runbook に書いた。

### Step 5：リアルタイム化

- Django Channels と WebSocket。ポーリングをやめる
- ElastiCache（Valkey）。ECS のタスクが2つ以上でもメッセージが届く
- ElastiCache の夜間と休日の扱いを決める（[ADR-0001](adr/0001-realtime-websocket-elasticache.md) の「結果」）

完了条件：prd で、別々のタスクにつながった2人の間でメッセージが即時に届く。

### Step 6：添付ファイル

- ブラウザから S3 への直接のアップロード（署名付き URL）
- GuardDuty のマルウェア検査
- Step Functions：ファイルの種類で分岐し、複数ファイルを並列に処理し、失敗したら再試行と通知
- Lambda：画像の縮小、動画の1コマの切り出し、PDF の1ページ目の画像化
- 画面にサムネイルを表示
- ADR：Step Functions を選んだ理由

完了条件：画像、動画、PDF を同時に添付でき、サムネイルが表示される。わざと壊れたファイルを送ると Slack に通知が来る。

### Step 7：監視と通知

- CloudWatch のダッシュボード、アラーム、ログ
- SNS → Slack
- 分散トレース（X-Ray など。要検討）

完了条件：アラームの一覧と、各アラームが鳴ったときの対応が Runbook にある。

### Step 8：SLO と障害の試験

- SLO と、その根拠を決める
- AWS FIS で ECS のタスクの停止と AZ の障害を再現する
- ポストモーテムと Runbook を書く

完了条件：障害を2件以上起こし、検知、対応、振り返りの記録が残っている。

### Step 9：仕上げ

- 構成図（画像）、README、月額の費用、今後の課題

完了条件：README を1分読めば、何を、なぜ、どう作ったかが分かる。

## 4. 余力があればやること

- プロフィールのアイコン画像（Step 6 の仕組みを使う）
- 動画の変換（AWS Elemental MediaConvert）
