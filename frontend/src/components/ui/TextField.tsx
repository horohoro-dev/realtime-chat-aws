import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";

type TextFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
  description?: string;
  placeholder?: string;
};

export function TextField({ label, description, placeholder, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className="flex w-full flex-col gap-1.5">
      <Label className="text-sumi text-sm font-semibold">{label}</Label>
      <Input
        placeholder={placeholder}
        className="border-rule bg-paper text-sumi placeholder:text-nezumi hover:border-asagi focus:border-hanada focus:ring-hanada/25 invalid:border-akane invalid:focus:ring-akane/20 h-10 w-full rounded-md border px-3 text-[0.9375rem] transition-colors duration-150 outline-none focus:ring-2"
      />
      {description === undefined ? null : (
        <Text slot="description" className="text-nezumi text-xs">
          {description}
        </Text>
      )}
      <FieldError className="text-akane text-sm" />
    </AriaTextField>
  );
}
