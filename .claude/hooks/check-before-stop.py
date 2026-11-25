#!/usr/bin/env python3
"""Claude が応答を終える前に、変更のある側（frontend/、backend/）の整形、lint、型検査を動かす。

失敗があれば {"decision": "block"} を返し、結果を Claude に渡して直させる。
変更の有無は、作業ツリーと origin/main との merge-base の差分で判断する。
同じセッションで続けて MAX_BLOCKS 回止めても直らなければ、無限に繰り返さないよう終了を許し、
残った失敗を人に知らせる。ツールが入っていない側は飛ばす。
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

MAX_BLOCKS = 5
MAX_OUTPUT_CHARS = 8000
TIMEOUT_SECONDS = 300


def run(cmd, cwd):
    try:
        result = subprocess.run(  # noqa: S603
            cmd, cwd=cwd, capture_output=True, text=True, timeout=TIMEOUT_SECONDS, check=False
        )
    except FileNotFoundError:
        return None
    except subprocess.TimeoutExpired:
        return 1, f"{' '.join(cmd)} が {TIMEOUT_SECONDS} 秒で終わりませんでした"
    return result.returncode, (result.stdout + result.stderr).strip()


def changed_paths(root: Path) -> set[str]:
    paths: set[str] = set()
    status = run(["git", "status", "--porcelain", "--untracked-files=all"], root)
    if status and status[0] == 0:
        paths.update(line[3:].split(" -> ")[-1] for line in status[1].splitlines() if line)
    base = run(["git", "merge-base", "HEAD", "origin/main"], root)
    if base and base[0] == 0:
        diff = run(["git", "diff", "--name-only", base[1].strip(), "HEAD"], root)
        if diff and diff[0] == 0:
            paths.update(diff[1].splitlines())
    return paths


def frontend_checks(root: Path):
    cwd = root / "frontend"
    bin_dir = cwd / "node_modules" / ".bin"
    if not (bin_dir / "biome").exists():
        return []
    # package.json の lint と同じ検査を、色なしの短い形式で出す
    biome = [
        str(bin_dir / "biome"),
        "ci",
        "--error-on-warnings",
        "--colors=off",
        "--reporter=concise",
        "--max-diagnostics=50",
        ".",
    ]
    tsc = [str(bin_dir / "tsc"), "--noEmit", "--pretty", "false"]
    return [
        ("frontend: biome ci（整形と lint）", biome, cwd),
        ("frontend: tsc --noEmit（型検査）", tsc, cwd),
    ]


def backend_checks(root: Path):
    cwd = root / "backend"
    ruff = cwd / ".venv" / "bin" / "ruff"
    if not ruff.exists():
        return []
    return [
        ("backend: ruff check", [str(ruff), "check", "--output-format=concise", "."], cwd),
        ("backend: ruff format --check", [str(ruff), "format", "--check", "."], cwd),
    ]


def counter_file(session_id: str) -> Path:
    safe = "".join(c for c in session_id if c.isalnum() or c in "-_") or "default"
    return Path(tempfile.gettempdir()) / f"claude-check-before-stop-{safe}"


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ".").resolve()
    paths = changed_paths(root)

    checks = []
    if any(p.startswith("frontend/") for p in paths):
        checks += frontend_checks(root)
    if any(p.startswith("backend/") for p in paths):
        checks += backend_checks(root)

    failures = []
    for label, cmd, cwd in checks:
        result = run(cmd, cwd)
        if result is None or result[0] == 0:
            continue
        failures.append(f"## {label}\n$ {' '.join(cmd)}\n{result[1]}")

    counter = counter_file(str(payload.get("session_id", "")))
    if not failures:
        counter.unlink(missing_ok=True)
        return 0

    try:
        blocks = int(counter.read_text())
    except (OSError, ValueError):
        blocks = 0

    report = "\n\n".join(failures)
    if len(report) > MAX_OUTPUT_CHARS:
        report = report[:MAX_OUTPUT_CHARS] + "\n…（以下略）"

    if blocks >= MAX_BLOCKS:
        counter.unlink(missing_ok=True)
        message = (
            f"[check-before-stop] {MAX_BLOCKS} 回続けて直らなかったので、終了を許しました。"
            "整形、lint、型検査の失敗が残っています。人が確認してください。"
        )
        sys.stdout.write(json.dumps({"systemMessage": message}, ensure_ascii=False))
        return 0

    counter.write_text(str(blocks + 1))
    reason = (
        "[check-before-stop] 終える前の検査で失敗がありました。直してから終えてください"
        f"（{blocks + 1}/{MAX_BLOCKS} 回目）。\n"
        "整形と安全な自動修正は `make fix` で行えます。ルールの意図は "
        "docs/development/frontend-rules.md と docs/development/backend-rules.md にあります。"
        "抑止は、理由を書ける正当な場合に限ります。\n\n"
        f"{report}"
    )
    sys.stdout.write(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
