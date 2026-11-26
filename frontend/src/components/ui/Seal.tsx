// 利用者とルームには画像がないので、名前の最初の1字から印鑑に見立てた印を作る。
// 同じ名前なら、どの画面でも同じ色と傾きになる。利用者は丸い印、ルームは角の印にする
const sealInks = [
  "#b8382a",
  "#234a7c",
  "#3d6b47",
  "#54406e",
  "#8a4632",
  "#2e4a5c",
  "#7a5a14",
] as const;

const sizeStyles = {
  sm: "size-7 text-[13px] border-[1.5px]",
  md: "size-9 text-base border-2",
  lg: "size-11 text-lg border-2",
} as const;

type SealSize = keyof typeof sizeStyles;

type SealShape = "round" | "square";

type SealProps = {
  name: string;
  size?: SealSize;
  shape?: SealShape;
};

function hashName(name: string): number {
  return Array.from(name).reduce(
    (hash, char) => (hash * 31 + (char.codePointAt(0) ?? 0)) % 1_000_003,
    7,
  );
}

function sealGlyph(name: string): string {
  const first = Array.from(name.trim())[0] ?? "?";
  return first.toLocaleUpperCase("ja-JP");
}

export function Seal({ name, size = "md", shape = "round" }: SealProps) {
  const hash = hashName(name);
  const ink = sealInks[hash % sealInks.length] ?? sealInks[0];
  const tilt = (hash % 13) - 6;
  return (
    <span
      aria-hidden="true"
      className={`bg-surface font-seal inline-flex shrink-0 items-center justify-center leading-none font-bold ${sizeStyles[size]} ${shape === "round" ? "rounded-full" : "rounded-md"}`}
      style={{
        borderColor: ink,
        color: ink,
        boxShadow: `inset 0 0 0 1.5px var(--color-surface), inset 0 0 0 2.5px ${ink}`,
      }}
    >
      <span style={{ transform: `rotate(${tilt}deg)` }}>{sealGlyph(name)}</span>
    </span>
  );
}
