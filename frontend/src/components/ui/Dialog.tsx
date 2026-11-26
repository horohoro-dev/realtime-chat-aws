import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Button,
  Heading,
  Modal,
  ModalOverlay,
  Text,
} from "react-aria-components";

export function DialogTrigger(props: AriaDialogTriggerProps) {
  return <AriaDialogTrigger {...props} />;
}

type DialogProps = {
  title: string;
  description?: string;
  children: (close: () => void) => ReactNode;
};

// 狭い画面では下から出るシート、広い画面では中央の枠として出す
export function Dialog({ title, description, children }: DialogProps) {
  return (
    <ModalOverlay
      isDismissable
      className="entering:motion-safe:animate-overlay-in exiting:motion-safe:animate-overlay-out bg-ink/35 fixed inset-0 z-20 flex items-end justify-center sm:items-center sm:p-6"
    >
      <Modal className="entering:motion-safe:animate-sheet-in exiting:motion-safe:animate-sheet-out bg-surface max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl shadow-[0_24px_48px_-12px_rgb(30_43_51/0.35)] sm:max-w-md sm:rounded-2xl">
        <AriaDialog className="outline-none">
          {({ close }) => (
            <div className="relative flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-1.5">
                <Heading slot="title" className="text-ink pr-10 text-lg font-bold">
                  {title}
                </Heading>
                {description === undefined ? null : (
                  <Text slot="description" className="text-muted text-sm leading-relaxed">
                    {description}
                  </Text>
                )}
              </div>
              {children(close)}
              <Button
                onPress={close}
                aria-label="閉じる"
                className="pressed:bg-rule text-muted hover:bg-paper hover:text-ink focus-visible:ring-ai absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-lg outline-none focus-visible:ring-2 sm:top-4 sm:right-4"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
