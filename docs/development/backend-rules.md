# バックエンドの書き方の決まり

作成日：2026-11-25

バックエンド（`backend/`）の Python の書き方の決まりです。整形とリントは ruff（Python の整形とリントのツール）が受け持ち、設定は `backend/pyproject.toml` の `[tool.ruff]` にあります。違反があると `make lint-backend`（`uv run ruff check .` と `uv run ruff format --check .`）が失敗します。検査を動かす流れは [contributing.md の3章](contributing.md) にあります。

## 1. 有効にしているルール

| ruff の記号 | 元のツール | 検査すること |
|---|---|---|
| `E`、`W` | pycodestyle | 書式。1行は100文字まで |
| `F` | Pyflakes | 未使用の import と変数、未定義の名前 |
| `I` | isort | import の並び |
| `N` | pep8-naming | 名前の付け方（関数は snake_case、クラスは PascalCase） |
| `UP` | pyupgrade | Python 3.13 の書き方への置き換え |
| `B` | flake8-bugbear | バグになりやすい書き方（変更できる値を引数の既定値にするなど） |
| `A` | flake8-builtins | `id`、`type` など組み込みの名前の上書き |
| `C4` | flake8-comprehensions | 内包表記の書き方 |
| `DTZ` | flake8-datetimez | タイムゾーンのない `datetime` の使用 |
| `DJ` | flake8-django | Django のモデルとフォームの書き方 |
| `T20` | flake8-print | `print` の残し忘れ。ログは `logging` で出す |
| `PIE`、`RET`、`SIM`、`RUF` | 各種 | 不要な書き方、`return` の書き方、簡略化 |
| `PT` | flake8-pytest-style | pytest の書き方 |
| `TID` | flake8-tidy-imports | 相対 import の禁止。`from apps.common.views import ...` のように書く |
| `ARG` | flake8-unused-arguments | 使わない引数 |
| `PTH` | flake8-use-pathlib | `os.path` ではなく `pathlib` を使う |
| `ERA` | eradicate | コメントアウトしたコードの残し忘れ |
| `PL` | Pylint | 引数の数（6個まで）、分岐の数、マジックナンバーなど |
| `S` | flake8-bandit | セキュリティ（`eval`、固定のパスワード、`subprocess` のシェル実行など） |
| `BLE` | flake8-blind-except | `except Exception` での握りつぶし |
| `LOG`、`G` | flake8-logging など | `logging` の使い方。メッセージに f-string を使わず、引数で渡す |

## 2. ルールを外している場所

| 場所 | 外すルール | 理由 |
|---|---|---|
| すべて | `RUF001`〜`RUF003` | 日本語の全角の括弧や句読点を、紛らわしい文字として検出するため |
| `tests/` | `S101`、`S105`、`S106`、`PLR2004`、`ARG001` | pytest は `assert` で検査する。テストには固定のパスワードと期待値の数値を書く。フィクスチャを引数で受けるだけのことがある |
| `apps/**/views.py` | `ARG001` | Django のビュー関数は、使わなくても `request` を受け取る |
| `config/settings/local.py`、`test.py` | `S105` | `SECRET_KEY` が、公開してよい固定の値 |
| `**/migrations/` | `E501`、`RUF012` | Django が生成するファイル |

## 3. 抑止の書き方

ルールに当たっても正しいコードだと判断したときだけ、その行の末尾に、ルールの記号と理由を書いて抑止します。

```python
from config.settings.base import *  # noqa: F403  設定の継承は Django の慣習
```

ファイルやディレクトリ単位で外すルールを足すときは、`pyproject.toml` の `[tool.ruff.lint.per-file-ignores]` に理由のコメントを付けて書き、PR の「人が確認してほしい点」に挙げます。
