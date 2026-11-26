import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";

type FormLayout = "stack" | "inline";

type FormProps = Omit<AriaFormProps, "className"> & {
  // inline は入力欄とボタンを横に並べ、ボタンを入力欄の下の端にそろえる
  layout?: FormLayout;
};

const layouts: Record<FormLayout, string> = {
  stack: "flex flex-col gap-6",
  inline: "flex items-end gap-2",
};

export function Form({ layout = "stack", ...props }: FormProps) {
  return <AriaForm {...props} className={layouts[layout]} />;
}
