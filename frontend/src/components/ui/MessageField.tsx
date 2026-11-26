import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Label,
  TextArea,
} from "react-aria-components";

type MessageFieldProps = Omit<AriaTextFieldProps, "className" | "children"> & {
  label: string;
  placeholder?: string;
};

type EnterKeyEvent = {
  key: string;
  shiftKey: boolean;
  nativeEvent: { isComposing: boolean };
  target: EventTarget;
  preventDefault: () => void;
};

// Enter で送信し、Shift+Enter で改行する。かな漢字の変換を確定する Enter では送信しない
function submitOnEnter(event: EnterKeyEvent) {
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
    return;
  }
  if (!(event.target instanceof HTMLTextAreaElement)) {
    return;
  }
  event.preventDefault();
  event.target.form?.requestSubmit();
}

// 複数行の本文を書く入力欄。ラベルは画面に出さず、読み上げにだけ渡す
export function MessageField({ label, placeholder, ...props }: MessageFieldProps) {
  return (
    <AriaTextField {...props} className="flex min-w-0 flex-1 flex-col gap-1">
      <Label className="sr-only">{label}</Label>
      <TextArea
        rows={1}
        placeholder={placeholder}
        onKeyDown={submitOnEnter}
        className="border-rule bg-surface text-ink placeholder:text-muted/70 invalid:border-shu focus-visible:border-ai focus-visible:ring-ai/30 invalid:focus-visible:border-shu invalid:focus-visible:ring-shu/25 [field-sizing:content] max-h-48 min-h-11 w-full resize-none rounded-xl border px-3.5 py-2.5 text-[15px] leading-relaxed outline-none focus-visible:ring-2"
      />
      <FieldError className="text-shu text-[13px] font-medium" />
    </AriaTextField>
  );
}
