# ADR-0001 リアルタイム通信を ECS 上の WebSocket と ElastiCache で行う

- 状態：決定
- 日付：2026-11-25

## 背景

チャットでは、相手が送ったメッセージを、画面を再読み込みせずに表示する必要があります。

prd では ECS のタスクを2つの AZ に2つ以上置きます。利用者 A がタスク 1 に、利用者 B がタスク 2 に WebSocket でつないでいる場合、タスク 1 が受けたメッセージをタスク 2 にも渡す仕組みが要ります。

## 決定

- WebSocket を使い、ECS on Fargate の Django（Django Channels）で受けます。
- WebSocket は CloudFront と ALB を通します。HTTP の API と同じ入口です。
- タスクの間のメッセージの配信には、ElastiCache（Valkey）の Pub/Sub を使います。Django Channels の配信の仕組み（channel layer）の保存先にします。
- メッセージの保存は RDS（PostgreSQL）で行います。ElastiCache にはメッセージを保存しません。

## 検討した案

| 案 | 良い点 | 気になる点 |
|---|---|---|
| ECS ＋ Django Channels ＋ ElastiCache（採用） | HTTP の API と同じ ECS、ALB、認証、WAF で済む | ElastiCache の料金が常にかかる |
| API Gateway の WebSocket API ＋ Lambda ＋ DynamoDB | サーバーレスで、使わない時間の料金がほぼかからない | 入口が2つになり、認証と WAF の設定が分かれる。接続の管理を自分で書く |
| RDS の LISTEN/NOTIFY で配信する | ElastiCache が要らない | 保存と配信が同じ DB に乗り、DB の障害がそのままチャットの停止になる。Django Channels の標準の配信の仕組みは Redis 系が前提 |
| 定期的に API を呼ぶ（ポーリング） | インフラが増えない | 即時に届かない。利用者が増えると無駄な問い合わせが増える |

## 結果

- 良くなること：HTTP の API と WebSocket が同じ入口、同じ認証（セッションの Cookie）、同じ WAF で守られます。
- 増えること：ElastiCache の構築、監視、料金。ElastiCache はノードを止められない見込みのため、夜間と休日の停止の方法を別に決めます。
- 確かめること：CloudFront と ALB での WebSocket の接続の時間切れ（アイドルタイムアウト）の値と、ECS のタスクを入れ替えるときに接続が切れる影響
