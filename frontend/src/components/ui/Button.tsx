import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type ButtonProps = Omit<AriaButtonProps, "className">;

export function Button(props: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className="pressed:bg-sky-900 rounded-md bg-sky-700 px-4 py-2 font-medium text-white outline-none hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-50"
    />
  );
}
