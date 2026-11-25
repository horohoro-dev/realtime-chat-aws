# issue ループでの開発の進め方

作成日：2026-11-24

GitHub の issue、CodeRabbit、Claude Code を組み合わせて、issue の計画から PR のレビュー対応までを Claude Code に繰り返させる仕組みです。PR のマージだけは人が行います。

## 1. 要点

- 作業は、1つの PR で終わる大きさの issue に分けます。issue には要件と完了要件を細かく書きます。タスクの一覧の1行だけを渡すと、前提が足りずに実装がぶれ、PR も大きくなるからです。
- CodeRabbit が issue に Coding Plan を付け、Claude Code はそれを判断の材料にして実装します。PR を出す前に CodeRabbit CLI で手元の差分をレビューし、細かい指摘を先に直します。PR には `Fixes #<issue>` を書き、CodeRabbit が issue の要件と照らしてレビューします。
- Claude Code は、CodeRabbit の指摘を採るかどうかを判断して直し、指摘がなくなるまで繰り返します。済んだ PR には `loop:awaiting-merge` のラベルを付けて、次の issue に進みます。
- PR は develop に向けます。マージは人が行います。develop にマージされると、ループはその issue の作業を終えたとみなし、その issue に依存していた issue に着手できるようになります。
- issue が閉じるのは、develop を main にマージしたときです。GitHub は、既定のブランチ（main）へのマージでだけ `Fixes #` の issue を閉じます。

## 2. 流れ

| 順 | 担当 | すること |
|---|---|---|
| 1 | 人と Claude Code | 設計を決め、`docs/design/` に書く |
| 2 | Claude Code（`/tasks-to-issues`） | 設計を issue に分ける。人が一覧を確かめてから登録し、`loop:ready` を付ける |
| 3 | CodeRabbit | `loop:ready` の issue に Coding Plan を付ける |
| 4 | Claude Code（`/issue-loop`） | 依存の PR がすべて develop にマージされた issue を1つ選び、develop からブランチを作り、計画を読んで実装する |
| 5 | Claude Code と CodeRabbit CLI | `coderabbit review --agent` で手元の差分をレビューし、指摘を判断して直す。最大3回 |
| 6 | Claude Code | develop に向けた PR を作り、`@coderabbitai review` でレビューを頼む（Free プランは main 以外に向けた PR を自動でレビューしない） |
| 7 | CodeRabbit | PR をレビューする。紐づいた issue の要件を満たしているかも見る |
| 8 | Claude Code | 指摘を判断して直し、push する。指摘と CI の失敗がなくなるまで7と8を繰り返す |
| 9 | Claude Code | PR に `loop:awaiting-merge` を付け、4に戻る。着手できる issue がなくなったら、マージ待ちと依存待ちの一覧を報告して止まる |
| 10 | 人 | マージ待ちの PR を読み、マージする。止まっていたループを、もう一度動かす |

CLI のレビューと PR のレビューの違いは次のとおりです。CLI は速く回せますが、issue の要件との照合がなく、指摘が PR に残りません。そのため PR のレビューは省きません。

| | CLI のレビュー | PR のレビュー |
|---|---|---|
| 待ち時間 | 数分。push の必要がない | 1回5〜15分 |
| issue の要件との照合 | なし | あり（`Fixes #` の issue） |
| 指摘の記録 | 手元だけ。採らなかった指摘は PR の「人が確認してほしい点」に書く | PR に残る |
| 回数の上限 | 1時間あたりの回数がプランで決まる。`coderabbit review --usage` で残りを見る | CLI とは別の枠 |

## 3. ファイル

| ファイル | 役割 |
|---|---|
| `.claude/skills/issue-loop/SKILL.md` | ループの1回分の手順と、守ること |
| `.claude/skills/tasks-to-issues/SKILL.md` | 設計やタスクの一覧を issue に分ける手順 |
| `.github/ISSUE_TEMPLATE/task.yml` | issue の項目（背景、要件、完了要件、対象外、依存する issue、参照する設計文書） |
| `.github/pull_request_template.md` | PR の項目。1行目が `Fixes #` |
| `.coderabbit.yaml` | `loop:ready` の issue での自動の計画（`issue_enrichment.planning`）、紐づいた issue の評価（`reviews.assess_linked_issues`） |
| `.claude/settings.json` | ループに要る `gh` と `coderabbit review` の許可。マージ、承認、CLI の課金（`--use-credits`）とログインの拒否。編集ごとの整形と、応答を終える前の検査の hook（[contributing.md の3章](contributing.md)） |
| `docs/development/frontend-rules.md`、`backend-rules.md` | 実装のときに従う書き方の決まりと、Biome と ruff のルールの意図 |

## 4. ラベル

| ラベル | 付ける先 | 意味 |
|---|---|---|
| `loop:ready` | issue | ループが着手してよい。付けると CodeRabbit が計画を作る。PR が develop にマージされたら、ループが外す |
| `loop:in-progress` | issue | ループが作業中、または PR が develop へのマージ待ち。PR が develop にマージされたら、ループが外す |
| `loop:needs-human` | issue | ループでは進められない。理由は issue のコメントにある |
| `loop:awaiting-merge` | PR | レビュー対応が済み、人のマージを待つ |

## 5. 最初の準備

1. CodeRabbit の GitHub App をリポジトリに入れます。
2. `gh auth login` で GitHub にログインし、リポジトリ直下で `make labels` を実行して、4つのラベルを作ります。中身は `gh label create --force` で、何度実行しても同じ状態になります。

3. main のブランチ保護（[contributing.md の1章](contributing.md)）を設定します。必須チェックの `ci-result` は CI のワークフロー（`.github/workflows/ci.yml`）が報告するものなので、ワークフローを入れる前は、PR を必須にし、直接の push と強制 push を禁止するところまでにします。`ci-result` を必須チェックに足すのは、ci.yml を main にマージし、`ci-result` が一度報告されてからです。
4. ループを動かす PC に CodeRabbit CLI を入れ、人がログインします。`coderabbit auth status` でログインできているかを確かめます。

   ```bash
   curl -fsSL https://cli.coderabbit.ai/install.sh | sh
   coderabbit auth login
   ```

   クラウドのセッションでは、次のようにして API キーでログインします。環境変数に秘密の値を置かない決まりの、唯一の例外です。

   1. CodeRabbit の Organization settings → API keys で、クラウド専用の Agentic キーを期限つきで作ります。
   2. claude.ai のクラウド環境の setup script で CLI を入れます。setup script はログインしません（環境の変数を読めないため）。

      ```bash
      curl -fsSL https://cli.coderabbit.ai/install.sh | CR_CLI_SKIP_LOGIN=1 CODERABBIT_INSTALL_DIR=/usr/local/bin sh || echo "coderabbit install failed" >&2
      ```

   3. 同じ環境の環境変数に `CODERABBIT_API_KEY` を置きます。環境は本人しか使わない個人のものにします。
   4. セッションの開始時に、SessionStart hook（`.claude/hooks/session-start.sh`）が `coderabbit auth login --api-key` でログインします。CLI は `CODERABBIT_API_KEY` を自分では読まないため、hook でログインします。

   キーが漏れたと思ったら、CodeRabbit でそのキーを削除し、環境変数を新しいキーに替えます。CLI がないとき、またはログインできないとき、ループは CLI のレビューを飛ばして PR のレビューだけで進めます。

## 6. 動かし方

- **issue を作る**：Claude Code で `/tasks-to-issues docs/design/architecture.md` のように頼みます。登録の前に一覧を見せるので、確かめてから了承します。
- **ループを回す**：Claude Code で `/issue-loop` を動かします。着手できる issue がなくなると止まります。
- **寝ている間に回す**：クラウドのセッション（claude.ai/code）で `/issue-loop` を動かします。ローカルでは、許可していないコマンドで確認が出て止まることがあります（CodeRabbit を待つ `for` や `until` のシェルなど）。
- **マージのあと**：人がマージ待ちの PR を develop にマージしたら、もう一度 `/issue-loop` を動かします。ループは最初に、マージされた PR の issue から `loop:in-progress` と `loop:ready` を外します。issue は、develop を main にマージしたときに閉じます。

## 7. マージを人に残すための守り

| 守り | 内容 | 限界 |
|---|---|---|
| skill の指示 | `issue-loop` の「守ること」で、マージ、自動マージ、承認を禁じている | 指示なので、守られないことがありうる |
| settings.json の deny | `gh pr merge`、`gh pr review`、`gh api` でのマージと自動マージを拒否する | `python` や `node` など許可したコマンドを通せば同じことができる。誤操作を減らすためのもの |
| ブランチ保護 | PR を必須にし、`ci-result` の成功を必須にする | Claude Code は人と同じ GitHub のアカウントで動くので、GitHub の側でマージだけを Claude Code に禁じることはできない |

マージの前には、人が PR の差分を読みます。とくに `.github/`、`.claude/`、`infra/` と、PR の「人が確認してほしい点」に挙がったところを見ます。

## 8. 費用と時間の目安

- 1つの issue で、CLI のレビューに1回あたり数分、PR のレビューの待ちに1回あたり5〜15分かかります。CodeRabbit の計画は、着手のときに届いていれば読み、届いていなければ待ちません。
- CLI のレビューは、1つの issue で最大3回です。上限を超えた分の課金（`--use-credits`）は使いません。
- トークンを抑えるため、実装はサブエージェント（Sonnet か Opus）に分け、メインのセッションは判断とレビュー対応に使います。
