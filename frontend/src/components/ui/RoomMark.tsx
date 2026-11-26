const sizes = {
  sm: "size-7 text-[0.8125rem]",
  md: "size-10 text-base",
} as const;

type RoomMarkProps = {
  name: string;
  size?: keyof typeof sizes;
  tone?: "ai" | "onDark";
};

// ルーム名の1文字目を白く抜いた四角い印
export function RoomMark({ name, size = "md", tone = "ai" }: RoomMarkProps) {
  const initial = Array.from(name)[0] ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center leading-none font-bold text-white select-none ${sizes[size]} ${tone === "ai" ? "bg-ai" : "bg-hanada"}`}
    >
      {initial}
    </span>
  );
}
