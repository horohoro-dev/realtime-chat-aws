---

name: チャット
description: 藍染めの濃さの段で組む、業務のチャットツールの画面
colors:
aijiro: "oklch(0.975 0.007 235)"
kamenozoki: "oklch(0.935 0.028 228)"
mizu: "oklch(0.875 0.04 230)"
asagi: "oklch(0.7 0.07 232)"
hanada: "oklch(0.49 0.115 250)"
hanada-deep: "oklch(0.42 0.11 252)"
ai: "oklch(0.4 0.095 256)"
kon: "oklch(0.31 0.075 262)"
kachi: "oklch(0.23 0.045 266)"
sumi: "oklch(0.22 0.02 262)"
nezumi: "oklch(0.47 0.02 258)"
rule: "oklch(0.89 0.012 245)"
paper: "oklch(0.995 0.002 240)"
akane: "oklch(0.5 0.17 25)"
akane-wash: "oklch(0.965 0.02 25)"
dye-ai: "oklch(0.45 0.1 255)"
dye-akane: "oklch(0.48 0.15 25)"
dye-moegi: "oklch(0.46 0.1 150)"
dye-edomurasaki: "oklch(0.45 0.11 312)"
dye-kakishibu: "oklch(0.48 0.09 52)"
dye-asagi: "oklch(0.5 0.09 192)"
dye-uguisu: "oklch(0.46 0.07 110)"
typography:
headline:
fontFamily: "Hiragino Sans, Hiragino Kaku Gothic ProN, BIZ UDPGothic, Yu Gothic UI, Meiryo, Noto Sans JP, system-ui, sans-serif"
fontSize: "1.5rem"
fontWeight: 700
title:
fontSize: "1.125rem"
fontWeight: 700
body:
fontSize: "0.9375rem"
fontWeight: 400
lineHeight: 1.625
label:
fontSize: "0.875rem"
fontWeight: 600
caption:
fontSize: "0.6875rem"
fontWeight: 400
rounded:
mark: "0px"
control: "6px"
panel: "12px"
bubble: "16px"
spacing:
xs: "4px"
sm: "8px"
md: "16px"
lg: "24px"
components:
app-bar:
backgroundColor: "{colors.kachi}"
textColor: "{colors.paper}"
height: "48px"
noren:
backgroundColor: "{colors.ai}"
textColor: "{colors.paper}"
height: "56px"
button-primary:
backgroundColor: "{colors.hanada}"
textColor: "{colors.paper}"
rounded: "{rounded.control}"
height: "40px"
button-primary-hover:
backgroundColor: "{colors.hanada-deep}"
button-secondary:
backgroundColor: "{colors.paper}"
textColor: "{colors.sumi}"
rounded: "{rounded.control}"
height: "40px"
bubble-mine:
backgroundColor: "{colors.kamenozoki}"
textColor: "{colors.kachi}"
rounded: "{rounded.bubble}"
padding: "8px 14px"
bubble-other:
backgroundColor: "{colors.paper}"
textColor: "{colors.sumi}"
rounded: "{rounded.bubble}"
padding: "8px 14px"
input:
backgroundColor: "{colors.paper}"
textColor: "{colors.sumi}"
rounded: "{rounded.control}"
height: "40px"
---

# Design System: チャット

## Overview

**Creative North Star: 「暖簾をくぐる」**

ルームは、暖簾をくぐって入る場所として描く。画面の上の褐色のバーが鴨居で、チャットの画面ではそこからルーム名を白く染め抜いた藍の暖簾が下がる。暖簾の下端は布の分かれ目で 3 枚（狭い画面）または 5 枚（広い画面）に分かれる。世界観が持ち込むのは、色（藍染めの濃さの段）、字（システムの和文ゴシック）、密度、そしてこの暖簾の見出しだけで、画面の配置、ナビゲーション、操作部品は一般的なチャットツールのままにする。

毎日使う業務の道具なので、装飾より読みやすさを優先する。誰の発言かは位置（自分は右、ほかの人は左）、名前、丸い紋（頭文字を白く抜いた染め色の円）の3つで示し、色だけに頼らない。

**Key Characteristics:**

- 藍の濃さの段だけで組む。赤（茜）は誤りだけに使う
- 押せるものだけが縹（hanada）
- 人は丸い紋、ルームは四角い暖簾の札
- 罫線は 1px、影はほとんど使わない

## Colors

藍染めの色名を、薄いものから濃いものへ順に使う。

### Primary

- **縹（hanada）**：ボタン、リンク、フォーカスの輪、送信。押せるものにだけ使う。
- **藍（ai）**：暖簾（ルームの見出し）とルームの札。
- **褐色（kachi）**：鴨居（アプリのバー）。いちばん濃い面。

### Neutral

- **藍白（aijiro）**：画面の地。
- **紙（paper）**：パネル、ほかの人の吹き出し、入力欄。
- **瓶覗（kamenozoki）**：自分の吹き出し、選択中のルーム、押したときの面。
- **水（mizu）**：選択の色、スクロールバー、薄い枠。
- **墨（sumi）／鼠（nezumi）**：本文と補足の文字。nezumi は紙の上で 4.5:1 以上。
- **罫（rule）**：1px の区切り線。

### State

- **茜（akane）／茜の地（akane-wash）**：入力の誤りと、取得・送信の失敗だけ。

### 人の紋の色

dye-ai、dye-akane、dye-moegi、dye-edomurasaki、dye-kakishibu、dye-asagi、dye-uguisu の7色。username から決まり、メッセージ、メンバーの一覧、上のバーのどこでも同じ人は同じ色になる。白い頭文字との対比は 4.5:1 以上。

### Named Rules

**押せる色の決まり。** 縹は押せるものにだけ使う。見出しや飾りに縹を使わない。

**赤は誤りだけの決まり。** 茜は誤りと失敗だけに使い、強調や飾りに使わない。

## Typography

**Font:** システムの和文ゴシック（Hiragino Sans、BIZ UDPGothic、Yu Gothic UI、Meiryo、Noto Sans JP）。外部の配信は使わない。

**Character:** 1 書体で、見出し、ラベル、本文、時刻をまかなう。大きさは固定の rem の段で、流体の大きさは使わない。

### Hierarchy

- **Headline**（700、1.5rem）：ルームの一覧の見出し。
- **Title**（700、1.125rem）：暖簾のルーム名、ダイアログの見出し。
- **Body**（400、0.9375rem、行間 1.625）：メッセージの本文。
- **Label**（600、0.875rem）：入力欄のラベル、ボタン。
- **Caption**（400、0.6875rem〜0.75rem）：時刻、作成者、参加日。時刻は等幅の数字。

見出しと短い文は `word-break: auto-phrase` で文節の切れ目で折り返す。

## Layout

- チャットの画面は3列：ルームの一覧（lg 以上、幅 15rem）、会話（残り）、メンバー（xl 以上、幅 16rem）。
- lg より狭いときは、暖簾の左に一覧へ戻るボタンを出す。xl より狭いときは、暖簾にメンバーの人数のボタンを出し、ダイアログで一覧を見せる。
- 会話の列は最大 48rem で中央に寄せる。入力欄は下に固定し、本文は自動で高さが伸びる（最大 12rem）。
- ルームの一覧と作成の画面は 1 列で、最大 42rem と 32rem。
- 間隔は 4px の格子。見出しの上を下より広く取る。

## Elevation & Depth

ほぼ平らで、面の濃さの違いと 1px の罫で奥行きを出す。影は2種類だけ：パネルと入力欄の `0 1px 2px` のごく薄い影、ダイアログの `0 24px 48px -12px` の影。

## Shapes

- **暖簾の札（ルームの印）**：角のない四角で、下端の中央に高さ 28%、幅 2px の切れ目（`noren-cut`）。
- **紋（人の印）**：円の内側 2px に白い細い輪。
- **吹き出し**：角丸 16px で、話し手の側の角だけ 6px。
- **操作部品**：角丸 6px。パネルとダイアログは 12px。

## Components

- **暖簾（Noren）**：ルーム名、戻る、メンバー、招待のボタンを持つ藍の帯。下端に布の分かれ目。
- **メッセージ**：自分は右寄せで瓶覗の吹き出し、時刻は左。ほかの人は左寄せで紙の吹き出し、紋と名前は5分以内の連続した発言の最初だけ、時刻は右。日付が変わる発言の上に日付の区切り。
- **入力欄（MessageField）**：Enter で送信、Shift + Enter で改行。かな漢字の変換の確定の Enter では送信しない。
- **ダイアログ**：狭い画面では下から出るシート、広い画面では上寄せの中央。Esc と外側で閉じ、閉じるとフォーカスを開いたボタンに戻す。
- **Alert**：トーストは使わない。結果はその場のインラインの表示で伝える。

## Do's and Don'ts

- Do：誰の発言かを、位置、名前、紋の3つで示す。
- Do：読み込み中は行の形の薄い面（Skeleton）を出し、読み上げには文で伝える。
- Don't：API にない機能（既読、オンライン状態、リアクション）を示唆する飾りを置かない。
- Don't：縹と茜を飾りに使わない。
- Don't：暖簾の切れ目を操作部品の上に重ねない。切れ目は帯の下端だけ。
