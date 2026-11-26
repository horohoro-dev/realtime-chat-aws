import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { type ButtonShape, type ButtonVariant, buttonClassName } from "./buttonStyles.ts";

type ButtonProps = Omit<AriaButtonProps, "className"> & {
  variant?: ButtonVariant;
  // square は文字のないアイコンだけのボタン。aria-label で名前を付ける
  shape?: ButtonShape;
};

export function Button({ variant = "primary", shape = "wide", ...props }: ButtonProps) {
  return <AriaButton {...props} className={buttonClassName(variant, shape)} />;
}
