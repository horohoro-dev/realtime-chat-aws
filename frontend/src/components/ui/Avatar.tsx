const dyes = [
  "bg-dye-ai",
  "bg-dye-akane",
  "bg-dye-moegi",
  "bg-dye-edomurasaki",
  "bg-dye-kakishibu",
  "bg-dye-asagi",
  "bg-dye-uguisu",
] as const;

const sizes = {
  sm: "size-6 text-[0.6875rem]",
  md: "size-9 text-sm",
} as const;

type AvatarProps = {
  username: string;
  size?: keyof typeof sizes;
};

// 利用者は画像を持たないので、username から頭文字と色を決める。同じ username はどの画面でも同じ色になる
function dyeOf(username: string) {
  const hash = Array.from(username).reduce(
    (sum, char) => (sum * 31 + (char.codePointAt(0) ?? 0)) % 1_000_003,
    7,
  );
  return dyes[hash % dyes.length] ?? dyes[0];
}

// 名前はいつも隣に文字で出すので、印そのものは読み上げない
export function Avatar({ username, size = "md" }: AvatarProps) {
  const initial = Array.from(username)[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full leading-none font-bold text-white select-none after:absolute after:inset-[2px] after:rounded-full after:border after:border-white/40 ${sizes[size]} ${dyeOf(username)}`}
    >
      {initial}
    </span>
  );
}
