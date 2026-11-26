const sizes = {
  sm: "size-7 pb-1 text-[0.8125rem]",
  md: "size-10 pb-1.5 text-base",
} as const;

type RoomMarkProps = {
  name: string;
  size?: keyof typeof sizes;
  tone?: "ai" | "onDark";
};

// ルーム名の1文字目を白く抜いた、暖簾の形の印。下端の中央の切れ目は、のれんの布の分かれ目
export function RoomMark({ name, size = "md", tone = "ai" }: RoomMarkProps) {
  const initial = Array.from(name)[0] ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`noren-cut inline-flex shrink-0 items-center justify-center leading-none font-bold text-white select-none ${sizes[size]} ${tone === "ai" ? "bg-ai" : "bg-hanada"}`}
    >
      {initial}
    </span>
  );
}
