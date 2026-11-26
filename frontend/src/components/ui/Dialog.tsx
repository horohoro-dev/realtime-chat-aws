import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

export function DialogTrigger(props: AriaDialogTriggerProps) {
  return <AriaDialogTrigger {...props} />;
}

type DialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

// 外側を押すか Esc で閉じる。閉じるとフォーカスは開いたボタンに戻る
export function Dialog({ title, description, children }: DialogProps) {
  return (
    <ModalOverlay
      isDismissable
      className="bg-kachi/45 entering:animate-overlay-in fixed inset-0 z-50 flex items-end justify-center motion-reduce:animate-none sm:items-start sm:p-6 sm:pt-[12vh]"
    >
      <Modal className="entering:animate-dialog-in w-full motion-reduce:animate-none sm:max-w-md">
        <AriaDialog className="border-rule bg-paper relative max-h-[85dvh] overflow-y-auto rounded-t-xl border px-5 pt-5 pb-6 shadow-[0_24px_48px_-12px_oklch(0.23_0.045_266/0.35)] outline-none sm:rounded-xl sm:px-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Heading slot="title" className="text-kachi text-lg font-bold">
                {title}
              </Heading>
              {description === undefined ? null : (
                <p className="text-nezumi text-sm leading-relaxed">{description}</p>
              )}
            </div>
            <AriaButton
              slot="close"
              aria-label="閉じる"
              className="text-nezumi hover:bg-kamenozoki/70 hover:text-sumi focus-visible:outline-hanada -mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md outline-offset-2 focus-visible:outline-2"
            >
              <X aria-hidden="true" className="size-5" />
            </AriaButton>
          </div>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
