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
