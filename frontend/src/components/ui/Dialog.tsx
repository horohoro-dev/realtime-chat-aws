import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { Button } from "./Button.tsx";

export function DialogTrigger(props: AriaDialogTriggerProps) {
  return <AriaDialogTrigger {...props} />;
}

type ModalDialogProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

// DialogTrigger の2つ目の子として置く。Esc、外側のクリック、右上のボタンで閉じる
export function ModalDialog({ title, description, children }: ModalDialogProps) {
  return (
    <ModalOverlay
      isDismissable
      className="entering:animate-[fade-in_200ms_var(--ease-ui)] exiting:animate-[fade-in_120ms_var(--ease-ui)_reverse] bg-ink/30 fixed inset-0 z-20 flex items-end justify-center motion-reduce:animate-none sm:items-center sm:p-6"
    >
      <Modal className="entering:animate-[rise-in_200ms_var(--ease-ui)] exiting:animate-[rise-in_120ms_var(--ease-ui)_reverse] border-line bg-card max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-t-lg border shadow-[0_24px_48px_-16px_rgb(31_48_56/0.25)] motion-reduce:animate-none sm:max-w-md sm:rounded-lg">
        <AriaDialog className="relative p-6 outline-none sm:p-8">
          <div className="mb-6">
            <Heading slot="title" className="text-ink pr-12 text-xl font-semibold tracking-tight">
              {title}
            </Heading>
            {description === undefined ? null : (
              <p className="text-muted mt-2 text-base leading-relaxed">{description}</p>
            )}
          </div>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <Button slot="close" variant="ghost" shape="square" aria-label="閉じる">
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
