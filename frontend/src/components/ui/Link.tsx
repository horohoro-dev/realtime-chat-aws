import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";

type LinkProps = Omit<AriaLinkProps, "className">;

export function Link(props: LinkProps) {
  return (
    <AriaLink
      {...props}
      className="font-medium underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-sky-600"
    />
  );
}
