type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  size?: AvatarSize;
  // room は角の丸い四角、person は円
  shape?: "person" | "room";
};

// 白い文字との対比が 4.5:1 以上になる、彩度を抑えた色。紫の色相は入れない
const tones = [
  "#0d7480",
  "#3b5b8c",
  "#a2492b",
  "#5b6a26",
  "#a63a5b",
  "#82601a",
  "#2f6b4f",
  "#4d5e6b",
] as const;

const sizes: Record<AvatarSize, string> = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
};

// 同じ名前にはいつも同じ色を返す
function toneFor(name: string): string {
  const hash = Array.from(name).reduce(
    (current, char) => (current * 31 + (char.codePointAt(0) ?? 0)) % 2147483647,
    7,
  );
  return tones[hash % tones.length] ?? tones[0];
}

function initialOf(name: string): string {
  return (Array.from(name.trim())[0] ?? "?").toUpperCase();
}

// 名前は隣に文字で出すので、アバターは読み上げない
export function Avatar({ name, size = "md", shape = "person" }: AvatarProps) {
  const radius = shape === "room" ? "rounded-sm" : "rounded-full";
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: toneFor(name) }}
      className={`inline-flex shrink-0 items-center justify-center font-semibold text-white select-none ${radius} ${sizes[size]}`}
    >
      {initialOf(name)}
    </span>
  );
}
