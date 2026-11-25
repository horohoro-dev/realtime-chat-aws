#!/usr/bin/env python3
"""Edit/Write/MultiEdit で追加されたコメントに、作業経緯や会話に依存する表現がないか調べる。

見つかった場合は exit 2 で stderr に理由を出し、Claude にコメントの見直しを求める。
"""

import json
import re
import sys

SKIP_EXTENSIONS = (".md", ".mdx", ".txt", ".rst", ".json", ".lock", ".csv")

COMMENT_RE = re.compile(
    r"^\s*(#|//|/\*|\*|--|<!--|;)"
    r"|\s(#|//)\s"
)

PATTERNS = [
    r"以前は",
    r"元々",
    r"もともと",
    r"に変更",
    r"から変更",
    r"変更し(た|て)",
    r"変更前",
    r"移動し(た|て)",
    r"に移し",
    r"から移し",
    r"をやめ",
    r"ではなく",
    r"じゃなく",
    r"修正済",
    r"今回",
    r"先ほど",
    r"さっき",
    r"指摘",
    r"要望",
    r"依頼",
    r"ユーザー(の|が|から)",
    r"会話",
    r"チャット",
    r"経緯",
    r"に沿って",
    r"のために追加",
    r"(に|で)(置|書)くと",
    r"てしまう(ため|ので|から)",
    r"だけに(渡|置|限定|絞)",
    r"\bpreviously\b",
    r"\bused to\b",
    r"\bno longer\b",
    r"\b(changed|moved|switched|migrated) (from|to)\b",
    r"\binstead of\b",
    r"\bnow (uses|we|it)\b",
    r"\bas (requested|discussed|suggested)\b",
    r"\bper (the )?(review|discussion|request|feedback)\b",
    r"\badded (for|to support)\b",
]
PATTERN_RE = re.compile("|".join(PATTERNS), re.IGNORECASE)


def added_texts(tool_name, tool_input):
    if tool_name == "Write":
        return [(tool_input.get("content", ""), "")]
    if tool_name == "Edit":
        return [(tool_input.get("new_string", ""), tool_input.get("old_string", ""))]
    if tool_name == "MultiEdit":
        return [
            (e.get("new_string", ""), e.get("old_string", ""))
            for e in tool_input.get("edits", [])
        ]
    return []


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path", "") or ""
    if file_path.lower().endswith(SKIP_EXTENSIONS):
        return 0

    hits = []
    for new_text, old_text in added_texts(payload.get("tool_name", ""), tool_input):
        old_lines = set(old_text.splitlines())
        for line in new_text.splitlines():
            if line in old_lines:
                continue
            if COMMENT_RE.search(line) and PATTERN_RE.search(line):
                hits.append(line.strip())

    if not hits:
        return 0

    lines = "\n".join(f"  - {h}" for h in hits[:10])
    sys.stderr.write(
        f"[check-history-comments] {file_path} に、作業経緯や会話に依存している可能性があるコメントがあります:\n"
        f"{lines}\n"
        "このファイルを初めて読む人が、コメントだけで意味を理解できるか確認してください。\n"
        "変更の経緯・採用しなかった書き方との比較・会話や依頼への言及は、コメントではなく"
        "コミットメッセージ・PR 説明・チャットの回答に書きます。\n"
        "コードから読み取れない制約や仕様だけが残るように書き直すか、コメントを削除してください。"
        "問題のないコメントだと判断した場合は、そのままで構いません。\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
