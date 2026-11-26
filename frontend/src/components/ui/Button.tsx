import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type ButtonVariant = "primary" | "secondary" | "quiet";

type ButtonProps = Omit<AriaButtonProps, "className"> & {
  variant?: ButtonVariant;
};

const base =
  "inline-flex min-h-11 shrink-0 cursor-default items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ai focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 pending:opacity-70";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "pressed:bg-ai-deep bg-ai text-white hover:bg-ai-deep",
  secondary: "pressed:bg-paper border border-rule bg-surface text-ink hover:bg-paper",
  quiet: "pressed:bg-rule/70 px-3 text-ink hover:bg-rule/50",
};

export function Button({ variant = "primary", ...props }: ButtonProps) {
  return <AriaButton {...props} className={`${base} ${variantStyles[variant]}`} />;
}
