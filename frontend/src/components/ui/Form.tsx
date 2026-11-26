import { Form as AriaForm, type FormProps as AriaFormProps } from "react-aria-components";

type FormProps = Omit<AriaFormProps, "className">;

export function Form(props: FormProps) {
  return <AriaForm {...props} className="flex flex-col gap-5" />;
}
