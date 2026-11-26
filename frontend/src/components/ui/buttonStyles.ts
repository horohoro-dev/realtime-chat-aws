export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonShape = "wide" | "square";

// 押せる部品はボタンもボタンの見た目のリンクも、この値で同じ高さ、角、動きにそろえる
const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm text-base font-medium whitespace-nowrap outline-none transition-[translate,scale,background-color,border-color,color] duration-[120ms] ease-ui hover:duration-[150ms] hover:-translate-y-px pressed:translate-y-px pressed:scale-[.985] pressed:duration-[90ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-not-allowed disabled:opacity-50 pending:cursor-wait motion-reduce:translate-none motion-reduce:scale-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-action text-white hover:bg-action-strong pressed:bg-action-strong",
  secondary:
    "border border-line-strong bg-card text-ink hover:border-ink/40 hover:bg-surface pressed:bg-surface",
  ghost: "text-muted hover:bg-surface hover:text-ink pressed:bg-surface",
};

const shapes: Record<ButtonShape, string> = {
  wide: "h-11 px-6",
  square: "size-11",
};

export function buttonClassName(variant: ButtonVariant, shape: ButtonShape) {
  return `${base} ${variants[variant]} ${shapes[shape]}`;
}
