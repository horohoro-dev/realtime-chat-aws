# trivy の --format json の結果から、GitHub Actions のジョブの概要に出す Markdown を作る。
# 使い方: jq -r -f trivy-summary.jq trivy-results.json >> "$GITHUB_STEP_SUMMARY"

def severities: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
def severity_rank: . as $s | severities | index($s) // 99;
def has_fix: (.FixedVersion // "") != "";
# 表のセルの中の | と改行は、Markdown の表を壊す
def cell: tostring | gsub("\\|"; "\\|") | gsub("[\r\n]+"; " ");

[.Results[]? | .Target as $target | .Vulnerabilities[]? | . + {Target: $target}] as $vulns
| [.Results[]?.Target] as $targets
| (
    "## Trivy の脆弱性検査",
    "",
    "検査した対象：" + (if ($targets | length) == 0 then "なし" else ($targets | map("`" + . + "`") | join("、")) end),
    "",
    "| 深刻度 | 件数 | うち修正版あり |",
    "|---|---:|---:|",
    (severities[] as $s
      | [$vulns[] | select(.Severity == $s)] as $found
      | "| \($s) | \($found | length) | \([$found[] | select(has_fix)] | length) |"),
    "",
    "CI を失敗にするのは、修正版のある CRITICAL と HIGH だけです。すべての結果は Artifact の `trivy-results` からダウンロードできます。",
    "",
    (if ($vulns | length) == 0 then
      "脆弱性は見つかりませんでした。"
    else
      ( "| 深刻度 | パッケージ | 今の版 | 修正版 | ID | 対象 |",
        "|---|---|---|---|---|---|",
        ($vulns
          | sort_by((.Severity | severity_rank), .PkgName)[]
          | "| \(.Severity) | \(.PkgName | cell) | \(.InstalledVersion | cell) | "
            + (if has_fix then (.FixedVersion | cell) else "なし" end)
            + " | "
            + (if (.PrimaryURL // "") != "" then "[\(.VulnerabilityID)](\(.PrimaryURL))" else .VulnerabilityID end)
            + " | `\(.Target)` |")
      )
    end)
  )
