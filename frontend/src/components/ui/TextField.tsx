import type { KeyboardEvent } from "react";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
  TextArea,
} from "react-aria-components";

type TextFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
  description?: string;
};

const fieldControl =
  "w-full rounded-sm border border-line-strong bg-card px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-[140ms] ease-ui placeholder:text-muted/80 focus:border-action focus:shadow-[0_0_0_3px_var(--color-action-soft)] invalid:border-danger invalid:focus:shadow-[0_0_0_3px_rgb(163_52_31/0.12)]";

export function TextField({ label, description, ...props }: TextFieldProps) {
  return (
    <AriaTextField {...props} className="flex w-full flex-col gap-1.5">
      <Label className="text-ink text-sm font-medium">{label}</Label>
      <Input className={`h-12 ${fieldControl}`} />
      {description === undefined ? null : (
        <Text slot="description" className="text-muted text-sm">
          {description}
        </Text>
      )}
      <FieldError className="text-danger text-sm" />
    </AriaTextField>
  );
}

type MessageFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
  placeholder?: string;
};

// IME で変換を確定する Enter（isComposing、古い Safari では keyCode 229）は送信に使わない
function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }
  if (event.nativeEvent.isComposing || event.keyCode === 229) {
    return;
  }
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}

// 本文の入力欄。ラベルは読み上げにだけ出し、Enter で送信、Shift+Enter で改行する
export function MessageField({ label, placeholder, ...props }: MessageFieldProps) {
  return (
    <AriaTextField {...props} className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label className="sr-only">{label}</Label>
      <TextArea
        rows={1}
        placeholder={placeholder}
        onKeyDown={submitOnEnter}
        className={`[field-sizing:content] max-h-48 min-h-11 resize-none py-2.5 leading-normal ${fieldControl}`}
      />
      <FieldError className="text-danger text-sm" />
    </AriaTextField>
  );
}
