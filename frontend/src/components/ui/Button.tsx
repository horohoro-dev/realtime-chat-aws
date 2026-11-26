import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

const variants = {
  primary:
    "bg-hanada text-white hover:bg-hanada-deep pressed:bg-kon focus-visible:outline-hanada disabled:bg-mizu disabled:text-nezumi",
  secondary:
    "border border-rule bg-paper text-sumi hover:border-asagi hover:bg-kamenozoki/60 pressed:bg-kamenozoki focus-visible:outline-hanada",
  onDark:
    "bg-white/10 text-white hover:bg-white/20 pressed:bg-white/25 focus-visible:outline-white",
  quiet:
    "text-nezumi hover:bg-kamenozoki/70 hover:text-sumi pressed:bg-kamenozoki focus-visible:outline-hanada",
} as const;

const sizes = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[0.8125rem]",
  icon: "size-9 justify-center",
} as const;

type ButtonProps = Omit<AriaButtonProps, "className"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={`pending:cursor-wait pending:opacity-70 inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-md font-semibold whitespace-nowrap outline-offset-2 transition-colors duration-150 focus-visible:outline-2 ${variants[variant]} ${sizes[size]}`}
    />
  );
}
