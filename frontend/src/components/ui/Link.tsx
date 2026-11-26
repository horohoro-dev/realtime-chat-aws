import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";

const focusRing = "outline-offset-2 focus-visible:outline-2";

const variants = {
  inline:
    "font-semibold text-hanada underline decoration-asagi decoration-1 underline-offset-[0.2em] hover:decoration-hanada focus-visible:outline-hanada",
  primary:
    "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-hanada px-4 font-semibold text-sm text-white hover:bg-hanada-deep pressed:bg-kon focus-visible:outline-hanada",
  secondary:
    "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-rule bg-paper px-4 font-semibold text-sm text-sumi hover:border-asagi hover:bg-kamenozoki/60 focus-visible:outline-hanada",
  quiet:
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-nezumi text-sm hover:bg-kamenozoki/70 hover:text-sumi focus-visible:outline-hanada",
  nav: "flex min-h-10 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sumi hover:bg-kamenozoki/70 focus-visible:outline-hanada current:bg-kamenozoki current:font-semibold current:text-kachi",
  onDark:
    "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:outline-white",
  brand: "inline-flex items-center gap-2 rounded-sm text-white focus-visible:outline-white",
  stretched:
    "font-semibold text-kachi after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-hanada",
} as const;

type LinkProps = Omit<AriaLinkProps, "className"> & {
  variant?: keyof typeof variants;
};

export function Link({ variant = "inline", ...props }: LinkProps) {
  return (
    <AriaLink
      {...props}
      className={`cursor-pointer transition-colors duration-150 ${variant === "stretched" ? "" : focusRing} ${variants[variant]}`}
    />
  );
}
