# フロントエンドの書き方の決まり

作成日：2026-11-25

フロントエンド（`frontend/`）の React、TanStack Query、React Aria Components、Tailwind CSS の書き方の決まりです。決まりのほとんどは Biome（リントと整形のツール）の設定 `frontend/biome.json` で検査し、違反があると `pnpm run lint` が失敗します。この文書は、各ルールの意図と、違反したときの直し方を書いたものです。

検査を動かす流れは [contributing.md の3章](contributing.md) にあります。

## 1. 検査の仕組み

| 仕組み | 置き場所 | 検査すること |
|---|---|---|
| Biome の組み込みのルール | `frontend/biome.json` の `linter` | React、TanStack Query、テスト、型を使う検査、import の制限など |
| Biome のプラグイン | `frontend/biome-plugins/*.grit` | 組み込みのルールにない、この文書の2章、3章、4章の決まり。GritQL（Biome がプラグインに使うコードの検索言語）で書く |
| TypeScript の型検査 | `frontend/tsconfig.json` | `strict` などの型の検査 |

- Biome の警告も失敗に数えます（`biome ci --error-on-warnings`）。警告のまま残すことはしません。
- 整形と、安全に直せる違反（import の並び、Tailwind のクラスの並びなど）は `pnpm run format`（`make fix`）で直ります。

## 2. Effect は外部のシステムとの同期にだけ使う

React の公式の文書は、Effect（`useEffect`、`useLayoutEffect`）を「React の外に出るための非常口」と位置づけています。React の外のシステム（ブラウザの API、React 以外のウィジェット、ネットワークの接続など）と同期するときにだけ使います。

| したいこと | 書き方 |
|---|---|
| props や state から計算できる値を表示する | 描画中に計算する。state にしない。計算が重いと測って分かったときだけ `useMemo` を使う |
| 利用者の操作（クリック、送信）で何かをする | イベントハンドラの中に書く。送信の POST も同じ |
| prop が変わったら state をすべて初期化する | 親から `key` を渡して作り直す |
| 親に変更を知らせる | state を変えるのと同じイベントハンドラで `onChange` を呼ぶ |
| サーバーのデータを取る | TanStack Query のフックを使う（3章） |
| 外部のストアを購読する | `useSyncExternalStore` を使う |
| アプリの起動時に一度だけ動かす | モジュールの最上位で動かす。開発中は Effect が2回動くため |

検査するルール：

- プラグイン `no-set-state-in-effect.grit`：Effect の本体で state の setter（`setXxx`）を同期的に呼ぶものを検出します。setInterval やイベントリスナーのコールバックなど、内側の関数の中で呼ぶものは対象外です。
- プラグイン `no-fetch-in-effect.grit`：Effect の中での `fetch` と API クライアント（`GET`、`POST` など）の呼び出しを検出します。
- `correctness/useExhaustiveDependencies`：Effect、`useMemo`、`useCallback` の依存配列の漏れと余分を検出します。依存配列を書かない Effect も違反にします（`reportMissingDependenciesArray`）。

外部のシステムとの同期で、どうしても Effect の中で set する必要があるときは、7章のとおり理由を書いて抑止します。

## 3. サーバーのデータは TanStack Query で扱う

API の応答は TanStack Query のキャッシュに置き、コンポーネントの state にコピーしません。

- クエリ（`useQuery` など）とミューテーション（`useMutation`）は `src/api/queries/` に、機能ごとのフック（`useProjects()`、`useCreateProject()` など）として書きます。画面と部品はそのフックを使います。`noRestrictedImports` で、`src/api/` の外から `useQuery`、`useMutation`、`queryOptions` などを読み込むと違反になります。
- クエリキー（キャッシュを見分ける配列）は、機能ごとのキーの工場（キーを返す関数をまとめたオブジェクト）で作ります。キーは一般的なものから特定のものへ並べます（例：`["projects", "list", { filters }]`、`["projects", "detail", id]`）。こうすると `["projects"]` で、その機能のキャッシュをまとめて無効にできます。
- データの取得に効く値（絞り込みの条件、ID）は、すべてクエリキーに入れます。キーが変わると TanStack Query が取り直すので、`refetch` で条件を渡し直すことはしません。
- 取得した `data` を `useEffect` で state にコピーしません。`data` をそのまま使います。
- API は `src/api/client.ts` の openapi-fetch のクライアントで呼びます。`fetch` を `src/api/` の外で直接呼ぶと、プラグイン `no-direct-fetch.grit` が検出します。CSRF トークンの付与と 503 の扱いが `client.ts` にあるためです。

検査するルール：`noTanstackQueryRestDestructuring`（`useQuery` の結果を `...rest` で受けない）、`noTanstackQueryVoidQueryFn`（値を返さない `queryFn` を書かない）、`useTanstackQueryStableQueryClient`（`QueryClient` を描画のたびに作らない）、`noFloatingPromises`、`noMisusedPromises`（Promise の結果を捨てない）。

## 4. コンポーネントの書き方

- 関数コンポーネントを、`function` の宣言で書きます（`useReactFunctionComponents`、`useReactFunctionComponentDefinition`）。クラスコンポーネントと、アロー関数での定義は違反です。エラーの境界（描画中の例外を受け止める部品）は、React Router のルートの `ErrorBoundary` を使います。
- 名前付きの export を使い、`export default` を使いません（`noDefaultExport`）。`vite.config.ts` だけは Vite が default export を求めるので例外にしています。
- 1つのファイルからは、コンポーネントと定数だけを export します（`useComponentExportOnlyModules`）。Vite の Fast Refresh（編集した部品だけを差し替える開発中の機能）が働くようにするためです。
- コンポーネントの中でコンポーネントを定義しません（`noNestedComponentDefinitions`）。描画のたびに別の部品として作り直され、state が消えます。
- `forwardRef` を使いません（`noReactForwardRef`）。React 19 では `ref` を普通の props として受け取れます。
- props と state を直接書き換えません（`noReactPropAssignments`、`noReactDirectStateMutation`）。React の決まりでは、props と state は変更できない値として扱います。
- フックは、コンポーネントとカスタムフックの最上位で、早期の `return` より前に呼びます（`useHookAtTopLevel`）。
- リストの `key` に配列の添字を使いません（`noArrayIndexKey`）。行を足したり並べ替えたりすると、state が別の行に移ります。
- `{count && <X />}` のように、数値が `0` のとき `0` が表示される書き方をしません（`noLeakedRender`）。`{count > 0 && <X />}` と書きます。
- `import React from "react"` と `import * as React from "react"` を使わず、`useState` などを名前付きで読み込みます。

### 4.1 メモ化は React Compiler に任せる

React Compiler（コンポーネントとフックのメモ化をビルド時に自動で入れるツール）を使います。設定は `vite.config.ts` にあり、`@rolldown/plugin-babel` で `@vitejs/plugin-react` の `reactCompilerPreset()` を通します。開発サーバー、本番のビルド、Vitest のすべてで働きます。

- `useMemo`、`useCallback`、`memo` は書きません。プラグイン `no-manual-memo.grit` が検出します。
- コンポーネントの中で作った関数は、そのまま JSX の属性に渡します（`onSubmit={handleSubmit}`、`onPress={() => setOpen(true)}`）。描画のたびに関数を作り直さないための使い回しは、compiler が入れます。同じ問題を `useCallback` で防がせる Biome の `performance/noJsxPropsBind` は、React の domain を `all` にすると有効になりますが、`no-manual-memo.grit` とぶつかるので `biome.json` で切っています。
- メモ化を細かく決める必要があるときだけ、7章のとおり理由を書いて抑止します。React の公式の文書が例に挙げているのは、Effect の依存に渡す値を安定させる場面です。
- compiler が安全に最適化できないコード（描画中に ref を読み書きするなど）は、`nursery/useReactCompiler` が検出します。このルールは、React Compiler を検査だけのモードで動かしたものです。
- 4章の決まり（props と state を書き換えない、フックを最上位で呼ぶなど）は、compiler が前提にしている React の決まりそのものです。破ると、そのコンポーネントは最適化されないか、正しく動きません。
- 配列をその場で書き換えるメソッド（`items.push(1)` など）は、4.2のプラグイン `no-array-mutation.grit` が検出します。オブジェクトの項目への代入（`item.name = "a"`）は検出できないので、レビューで確かめます。
- compiler の変換が原因で動きがおかしいと疑うときは、コンポーネントの本体の先頭に `"use no memo"` と書くと、そのコンポーネントを対象から外せます。外したままにするときは、理由をコメントに書きます。

### 4.2 値を書き換えずに、新しい値を作る

変数と配列を書き換えず、計算の結果を新しい値として作ります。React の state と props は書き換えてはいけない値で、書き換えない書き方にそろえておくと、state を直接書き換える間違いが起きにくくなります。どこで値が変わるかを追わずに読めるようにするためでもあります。

| 書かないもの | 検出するプラグイン | 代わりの書き方 |
|---|---|---|
| `class` | `no-class.grit` | データは `type` とそれを受け取る関数、部品は関数コンポーネント |
| `let`、`var` | `no-let.grit` | `const`。条件で変わる値は三項演算子か、値を return する関数で作る |
| `for`、`for...of`、`for...in`、`while`、`do...while` | `no-loop.grit` | `map`、`filter`、`reduce`、`some`、`every`、`find`。オブジェクトは `Object.entries` で配列にする |
| `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin` | `no-array-mutation.grit` | `[...items, item]`、`toSorted`、`toReversed`、`toSpliced`、`filter`、`with` |

```tsx
// 書かない
let total = 0;
for (const item of items) {
  total += item.price;
}
const sorted = items;
sorted.sort((a, b) => a.price - b.price);

// 書く
const total = items.reduce((sum, item) => sum + item.price, 0);
const sorted = items.toSorted((a, b) => a.price - b.price);
```

- `no-array-mutation.grit` は呼び出し先の型を見ません。配列でない値の同じ名前のメソッド（React Router の履歴の `push` など）も検出します。正しいと判断したときは、7章のとおり理由を書いて抑止します。
- ライブラリが `class` の継承を求める場合（`Error` を継承した独自のエラーなど）も、7章のとおり抑止します。エラーは、できるだけ `new Error("…", { cause })` で表します。
- ループでしか書きにくい処理（途中で抜ける、長い配列で性能を測って問題が出たなど）は、7章のとおり理由を書いて抑止します。

## 5. UI の部品と見た目

- React Aria Components は `src/components/` の部品の中でだけ使います。画面（`src/pages/`）とレイアウト（`src/layouts/`）からは `src/components/ui/` の部品を使います。
- トースト通知（React Aria Components の `Toast` など）は使いません。`noRestrictedImports` で、名前に `Toast` を含む部品の読み込みを違反にしています。結果はインラインの `Alert` かページ遷移で伝えます。
- 部品の状態による見た目は、tailwindcss-react-aria-components の修飾子（`selected:`、`pressed:`、`disabled:`、`focus-visible:` など）で書きます。`data-[selected]:` の形は使いません。
- Tailwind CSS のクラスは決まった順に並べます（`useTailwindSortedClasses`）。並べ替えは `make fix` と、Claude Code の編集の直後の整形で自動で行われます。
- `window.alert` などのブラウザのダイアログを使いません（`noAlert`）。確認は React Aria Components の Modal と Dialog で作った確認ダイアログで行います。

## 6. TypeScript

- `any` を使いません（`noExplicitAny`）。型が分からない値は `unknown` で受け、確かめてから使います。
- `!` で `null` でないと決めつけません（`noNonNullAssertion`）。`if` で確かめます。
- オブジェクトの型は `type` で書きます（`useConsistentTypeDefinitions`）。
- 型だけの import は `import type` で書きます（`useImportType`）。`tsconfig.json` の `verbatimModuleSyntax` と合わせるためです。
- 相対パスの import には拡張子を付けます（`useImportExtensions`。例：`./App.tsx`）。
- `enum` と `namespace` を使いません。`tsconfig.json` の `erasableSyntaxOnly` と合わせるためです。
- `switch` で、合併型のすべての場合を扱います（`useExhaustiveSwitchCases`）。
- `console.log` を残しません（`noConsole`。`console.error` だけ許します）。

## 7. 抑止の書き方

ルールに当たっても正しいコードだと判断したときだけ、その行の上に理由を書いて抑止します。理由のない抑止はしません。

```tsx
// biome-ignore lint/plugin: ResizeObserver の結果を state に移す。外部のシステムとの同期
useEffect(() => {
  ...
}, [element]);
```

プラグインのルールは `lint/plugin`、組み込みのルールは `lint/<グループ>/<ルール名>`（例：`lint/correctness/useExhaustiveDependencies`）で抑止します。ファイル全体やディレクトリ全体を `biome.json` で外すことは、人と相談して決めます。

## 8. 典拠

- React「You Might Not Need an Effect」 https://react.dev/learn/you-might-not-need-an-effect
- React「Rules of React」 https://react.dev/reference/rules
- React「React Compiler」 https://react.dev/learn/react-compiler/introduction
- TkDodo「Effective React Query Keys」（TanStack Query の保守者の一人によるクエリキーの設計の記事） https://tkdodo.eu/blog/effective-react-query-keys
- React Aria「Styling」 https://react-aria.adobe.com/styling
- Biome「Domains」 https://biomejs.dev/linter/domains/
- Biome「Linter Plugins」 https://biomejs.dev/linter/plugins/
- Biome「noRestrictedImports」 https://biomejs.dev/linter/rules/no-restricted-imports/
- Biome「useExhaustiveDependencies」 https://biomejs.dev/linter/rules/use-exhaustive-dependencies/
- Biome「noJsxPropsBind」 https://biomejs.dev/linter/rules/no-jsx-props-bind/
