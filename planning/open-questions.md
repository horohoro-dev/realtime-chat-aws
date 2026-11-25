# まだ決めていないこと

作成日：2026-11-25
更新日：2026-11-25

決めたら、決めた内容と理由を `docs/` の該当の文書か ADR に書き、未決定の表から消します。

## 1. 決めたこと

- Q1 リアルタイム通信の方式 → ECS ＋ Django Channels ＋ ElastiCache（2026-11-25。`docs/adr/0001-realtime-websocket-elasticache.md`）
- Q2 AWS アカウントの分け方 → management、security、log-archive、dev、prd の5アカウント（2026-11-25。`docs/design/architecture.md` の3.10）
- Q3 prd の RDS をマルチ AZ にするか → マルチ AZ にする。予算を理由に省かず、FIS でフェイルオーバーを試す（2026-11-25。`docs/design/architecture.md` の3.6）
- Q4 月額の予算の上限 → 上限は細かく決めない。夜間と休日は EventBridge Scheduler で止めて料金を抑える（2026-11-25。`docs/design/architecture.md` の4章）
- Q7 リポジトリ名 → `realtime-chat-aws`。名前だけで「AWS 上のリアルタイムチャット」と分かるため（2026-11-25）

## 2. 未決定

| 番号 | 論点 | 選択肢 | 判断の材料 | 決める時期 |
|---|---|---|---|---|
| Q5 | 独自ドメイン | (a) 取得する、(b) CloudFront の既定のドメイン | Cognito のカスタムドメインと ACM の証明書を見せるなら (a) が要る | Step 3 の前 |
| Q6 | Slack のワークスペース | (a) 自分用に作る、(b) 通知はメールだけ | Slack 通知を見せるなら (a) | Step 7 の前 |
| Q8 | アイコン画像をやるか | やる、やらない | インフラはほぼ変わらない。Step 9 の後の余力で決める | Step 9 の後 |
