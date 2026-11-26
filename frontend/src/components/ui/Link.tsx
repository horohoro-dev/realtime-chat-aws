import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";

type LinkVariant = "inline" | "button" | "nav" | "stretched" | "quiet";

type LinkProps = Omit<AriaLinkProps, "className"> & {
  variant?: LinkVariant;
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ai focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const variantStyles: Record<LinkVariant, string> = {
  inline: `font-semibold text-ai underline underline-offset-4 hover:no-underline ${focusRing}`,
  button: `pressed:bg-ai-deep inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ai px-4 text-sm font-semibold text-white hover:bg-ai-deep ${focusRing}`,
  nav: `flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-ink hover:bg-rule/50 current:bg-surface current:font-semibold current:shadow-[inset_3px_0_0_var(--color-ai)] ${focusRing}`,
  // 行全体を押せるように、親の relative な要素いっぱいに当たり判定を広げる
  stretched: `font-semibold text-ink outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ai`,
  quiet: `inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink ${focusRing}`,
};

export function Link({ variant = "inline", ...props }: LinkProps) {
  return <AriaLink {...props} className={variantStyles[variant]} />;
}
