# trivy の --format json の結果から、GitHub Actions のジョブの概要に出す Markdown を作る。
# 使い方: jq -r -f trivy-summary.jq trivy-results.json >> "$GITHUB_STEP_SUMMARY"

def severities: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
def severity_rank: . as $s | severities | index($s) // 99;
def has_fix: (.FixedVersion // "") != "";
# 表のセルの中の | と改行は、Markdown の表を壊す
def cell: tostring | gsub("\\|"; "\\|") | gsub("[\r\n]+"; " ");

[.Results[]? | .Target as $target | .Vulnerabilities[]? | . + {Target: $target}] as $vulns
| [.Results[]? | .Target as $target | .Secrets[]? | . + {Target: $target}] as $secrets
| [.Results[]? | .Target as $target | .Misconfigurations[]? | select(.Status == "FAIL") | . + {Target: $target}] as $misconfigs
| [.Results[]?.Target] as $targets
| (
    "## Trivy の検査",
    "",
    "CI を失敗にするのは、修正版のある CRITICAL と HIGH の脆弱性、すべてのシークレット、CRITICAL と HIGH の設定ミスです。",
    "",
    "### シークレット",
    "",
    (if ($secrets | length) == 0 then
      "シークレットは見つかりませんでした。"
    else
      ( "| 深刻度 | ルール | 内容 | 場所 |",
        "|---|---|---|---|",
        ($secrets
          | sort_by((.Severity | severity_rank), .Target)[]
          | "| \(.Severity) | \(.RuleID | cell) | \(.Title | cell) | `\(.Target):\(.StartLine)` |")
      )
    end),
    "",
    "### 設定ミス（Dockerfile、Terraform など）",
    "",
    (if ($misconfigs | length) == 0 then
      "設定ミスは見つかりませんでした。"
    else
      ( "| 深刻度 | ID | 内容 | 場所 |",
        "|---|---|---|---|",
        ($misconfigs
          | sort_by((.Severity | severity_rank), .Target)[]
          | "| \(.Severity) | "
            + (if (.PrimaryURL // "") != "" then "[\(.ID)](\(.PrimaryURL))" else .ID end)
            + " | \(.Title | cell) | `\(.Target):\(.CauseMetadata.StartLine // "")` |")
      )
    end),
    "",
    "### 依存ライブラリの脆弱性",
    "",
    "検査した対象：" + (if ($targets | length) == 0 then "なし" else ($targets | map("`" + . + "`") | join("、")) end),
    "",
    "| 深刻度 | 件数 | うち修正版あり |",
    "|---|---:|---:|",
    (severities[] as $s
      | [$vulns[] | select(.Severity == $s)] as $found
      | "| \($s) | \($found | length) | \([$found[] | select(has_fix)] | length) |"),
    "",
    "すべての結果は Artifact の `trivy-results` からダウンロードできます。",
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
