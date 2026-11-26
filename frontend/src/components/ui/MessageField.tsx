import type { KeyboardEvent, ReactNode } from "react";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  Text,
  TextArea,
} from "react-aria-components";

type MessageFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
  placeholder?: string;
  hint: string;
  action: ReactNode;
};

// Enter で送信し、Shift + Enter で改行する。かな漢字の変換を確定する Enter では送信しない
function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
    return;
  }
  // Safari は変換の確定の keydown で isComposing を false にし、keyCode を 229 にする
  if (event.keyCode === 229) {
    return;
  }
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}

export function MessageField({ label, placeholder, hint, action, ...props }: MessageFieldProps) {
  return (
    <AriaTextField {...props} className="group flex flex-col gap-1.5">
      <Label className="sr-only">{label}</Label>
      <div className="border-rule bg-paper focus-within:border-hanada focus-within:ring-hanada/20 group-invalid:border-akane rounded-lg border shadow-[0_1px_2px_oklch(0.23_0.045_266/0.06)] transition-colors duration-150 focus-within:ring-2">
        <TextArea
          placeholder={placeholder}
          rows={1}
          onKeyDown={submitOnEnter}
          className="text-sumi placeholder:text-nezumi block [field-sizing:content] max-h-48 min-h-11 w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1 text-[0.9375rem] leading-relaxed outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-2 pl-3.5">
          <Text slot="description" className="text-nezumi hidden text-xs sm:block">
            {hint}
          </Text>
          <span className="ml-auto">{action}</span>
        </div>
      </div>
      <FieldError className="text-akane text-sm" />
    </AriaTextField>
  );
}
