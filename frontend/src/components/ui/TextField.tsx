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
      <Label className="text-ink text-sm font-semibold">{label}</Label>
      <Input
        placeholder={placeholder}
        className="border-rule bg-surface text-ink placeholder:text-muted/70 invalid:border-shu focus-visible:border-ai focus-visible:ring-ai/30 invalid:focus-visible:border-shu invalid:focus-visible:ring-shu/25 min-h-11 rounded-lg border px-3 text-base outline-none focus-visible:ring-2"
      />
      {description === undefined ? null : (
        <Text slot="description" className="text-muted text-[13px] leading-relaxed">
          {description}
        </Text>
      )}
      <FieldError className="text-shu text-[13px] font-medium" />
    </AriaTextField>
  );
}
