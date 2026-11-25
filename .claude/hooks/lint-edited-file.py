#!/usr/bin/env python3
"""Edit/Write/MultiEdit の直後に、そのファイルだけを整形し、自動で直せない lint の違反を返す。

- frontend/ の .ts、.tsx、.js、.jsx、.json、.jsonc、.css: biome check --write のあと biome check
- backend/ の .py: ruff format、ruff check --fix のあと ruff check

自動で直せない違反が残ると exit 2 で stderr に出し、Claude に直させる。
未使用の import と変数は自動では消さない。import を書いた直後の、まだ使っていない状態を
壊さないため。ツールが入っていないときは何もしない。
"""

import json
import os
import subprocess
import sys
from pathlib import Path

FRONTEND_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".json", ".jsonc", ".css"}
FRONTEND_SKIP = {"src/api/schema.d.ts", "pnpm-lock.yaml"}
MAX_OUTPUT_CHARS = 6000
TIMEOUT_SECONDS = 60


def run(cmd, cwd):
    return subprocess.run(  # noqa: S603
        cmd, cwd=cwd, capture_output=True, text=True, timeout=TIMEOUT_SECONDS, check=False
    )


def check_frontend(root: Path, rel: str):
    biome = root / "frontend" / "node_modules" / ".bin" / "biome"
    if not biome.exists():
        return None
    cwd = root / "frontend"
    common = ["--colors=off", "--no-errors-on-unmatched", "--files-ignore-unknown=true"]
    run([str(biome), "check", "--write", *common, rel], cwd)
    result = run(
        [str(biome), "check", "--reporter=concise", "--error-on-warnings", *common, rel], cwd
    )
    if result.returncode == 0:
        return None
    return (result.stdout + result.stderr).strip()


def check_backend(root: Path, rel: str):
    cwd = root / "backend"
    ruff = cwd / ".venv" / "bin" / "ruff"
    if not ruff.exists():
        return None
    run([str(ruff), "format", "--quiet", rel], cwd)
    run([str(ruff), "check", "--fix", "--quiet", "--unfixable", "F401,F841", rel], cwd)
    result = run([str(ruff), "check", "--output-format=concise", rel], cwd)
    if result.returncode == 0:
        return None
    return (result.stdout + result.stderr).strip()


def check_file(root: Path, path: Path):
    """整形と lint を行い、残った違反の出力を返す。対象外のファイルなら None を返す。"""
    parts = path.relative_to(root).parts
    rel = str(Path(*parts[1:]))
    if parts[0] == "frontend" and path.suffix in FRONTEND_SUFFIXES:
        if rel in FRONTEND_SKIP or "node_modules" in parts:
            return None
        return check_frontend(root, rel)
    if parts[0] == "backend" and path.suffix == ".py" and ".venv" not in parts:
        return check_backend(root, rel)
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ".").resolve()
    path = Path(file_path).resolve()
    if not file_path or not path.is_file() or not path.is_relative_to(root):
        return 0

    try:
        output = check_file(root, path)
    except subprocess.TimeoutExpired:
        return 0
    if not output:
        return 0

    if len(output) > MAX_OUTPUT_CHARS:
        output = output[:MAX_OUTPUT_CHARS] + "\n…（以下略）"
    sys.stderr.write(
        f"[lint-edited-file] {path.relative_to(root)} を整形しました。"
        "ファイルの中身が変わっていることがあるので、次に編集する前に読み直してください。"
        "自動で直せない違反が残っています:\n"
        f"{output}\n"
        "違反を直してください。import を書いた直後でまだ使っていないなど、"
        "編集の途中なら続けて構いません。ルールの意図は "
        "docs/development/frontend-rules.md と docs/development/backend-rules.md にあります。"
        "抑止（biome-ignore、noqa）は、理由を書ける正当な場合に限ります。\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
