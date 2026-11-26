import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";

type FormLayout = "stack" | "inline";

type FormProps = Omit<AriaFormProps, "className"> & {
  layout?: FormLayout;
};

const layoutStyles: Record<FormLayout, string> = {
  stack: "flex flex-col items-stretch gap-5",
  inline: "flex items-start gap-2",
};

export function Form({ layout = "stack", ...props }: FormProps) {
  return <AriaForm {...props} className={layoutStyles[layout]} />;
}
