import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { type ButtonShape, type ButtonVariant, buttonClassName } from "./buttonStyles.ts";

type LinkVariant = "inline" | "quiet" | "stretched";

type LinkProps = Omit<AriaLinkProps, "className"> & {
  variant?: LinkVariant;
};

const variants: Record<LinkVariant, string> = {
  // 文中のリンク。細い下線の上に、ホバーで濃い下線が重なる
  inline:
    "font-medium text-action underline decoration-action/35 decoration-1 underline-offset-4 outline-none transition-[text-decoration-color] duration-[120ms] ease-ui hover:decoration-action hover:duration-[150ms] focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
  // 見出しや戻るリンクなど、地の文字の色のままのリンク
  quiet:
    "inline-flex min-h-11 items-center gap-1.5 rounded-xs text-muted outline-none transition-colors duration-[120ms] ease-ui hover:text-ink hover:duration-[150ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
  // 親の relative な箱の全体を押せる範囲にする。リンクの名前は子の文字だけになる
  stretched:
    "outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-action",
};

export function Link({ variant = "inline", ...props }: LinkProps) {
  return <AriaLink {...props} className={variants[variant]} />;
}

type LinkButtonProps = Omit<AriaLinkProps, "className"> & {
  variant?: ButtonVariant;
  // square は文字のないアイコンだけのリンク。aria-label で名前を付ける
  shape?: ButtonShape;
};

export function LinkButton({ variant = "primary", shape = "wide", ...props }: LinkButtonProps) {
  return <AriaLink {...props} className={buttonClassName(variant, shape)} />;
}
