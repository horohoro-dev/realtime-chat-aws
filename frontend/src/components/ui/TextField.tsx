import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
} from "react-aria-components";

type TextFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
};

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className="flex flex-col gap-1">
      <Label className="text-sm font-medium">{label}</Label>
      <Input className="rounded-md border border-gray-300 px-3 py-2 outline-none invalid:border-red-600 focus-visible:ring-2 focus-visible:ring-sky-600" />
      <FieldError className="text-sm text-red-700" />
    </AriaTextField>
  );
}
