#!/bin/bash
set -euo pipefail

# CLAUDE_CODE_REMOTE はクラウドセッションでだけ "true" になる。ローカルでは依存を入れない
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

if [ -f backend/pyproject.toml ]; then
  (cd backend && uv sync --frozen)
fi

if [ -f frontend/pnpm-lock.yaml ]; then
  corepack enable
  (cd frontend && pnpm install --frozen-lockfile)
fi

# CODERABBIT_API_KEY はクラウド環境の環境変数で渡す。CodeRabbit CLI はこの変数を自分では読まないため、ここでログインする。
# 出力にキーが出ないよう捨て、失敗してもセッションは止めない
if [ -n "${CODERABBIT_API_KEY:-}" ] && command -v coderabbit >/dev/null 2>&1; then
  if ! coderabbit auth login --api-key "$CODERABBIT_API_KEY" >/dev/null 2>&1; then
    echo "coderabbit login failed" >&2
  fi
fi
