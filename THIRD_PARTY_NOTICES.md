# 第三者のライセンス

このリポジトリには、ほかのリポジトリから取り込んだファイルがあります。取り込んだファイルのあるフォルダには、元のライセンスの全文を `LICENSE` として置いています。

| 場所 | 元のリポジトリ | ライセンス | 著作権者 | 変更 |
|---|---|---|---|---|
| `.claude/skills/impeccable/` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable)（`.claude/skills/impeccable/`、コミット `2fc5e14`） | Apache-2.0 | Paul Bakaus | なし |
| `.claude/skills/html/` | [mathbullet/skills](https://github.com/mathbullet/skills)（`plugins/html/skills/html/`） | MIT | mathbullet | あり |
| `.claude/skills/ja-text-communication/` | [mathbullet/skills](https://github.com/mathbullet/skills)（`plugins/ja-text-communication/skills/ja-text-communication/`） | MIT | mathbullet | なし |
| `.claude/skills/stop-ai-slop-jp/` | [iKora128/stop-ai-slop-jp](https://github.com/iKora128/stop-ai-slop-jp) | MIT | Daichi Nagashima | なし |

- 「変更」が「あり」のフォルダのファイルは、元のファイルをこのリポジトリに合わせて書き換えたものです。`theme.js` は元のリポジトリにはないファイルです。
- `.claude/skills/impeccable/` には、元のリポジトリの `LICENSE` と `NOTICE.md` を置いています。`NOTICE.md` は、この skill の一部が [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills)（MIT）をもとにしていることを示します。
- `.claude/skills/impeccable/` は、ほかの2つのプロジェクトのものを含みます。どちらもライセンスの全文を、取り込んだファイルの隣に置いています。
  - `scripts/modern-screenshot.umd.js` は、[qq15725/modern-screenshot](https://github.com/qq15725/modern-screenshot) の 4.7.0 の `dist/index.js` そのものです（MIT、wxm）。ライセンスの全文は `scripts/modern-screenshot.LICENSE` にあります。
  - `reference/ios.md` と `reference/android.md` は、[ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills) をもとに書き直したものです（MIT）。ライセンスの全文は `reference/platform-design-skills.LICENSE` にあります。
- [kayac/ecspresso](https://github.com/kayac/ecspresso)（MIT、KAYAC Inc.）は CI とデプロイでコマンドとして使い、ファイルはこのリポジトリに含めていません。
