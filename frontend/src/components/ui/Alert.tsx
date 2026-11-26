import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Text } from "react-aria-components";

type AlertTone = "info" | "error" | "success";

type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
};

const toneStyles: Record<
  AlertTone,
  { role: "status" | "alert"; className: string; Icon: LucideIcon }
> = {
  // リンクなど操作できる要素を含むので、読み上げを割り込ませない status にする
  info: { role: "status", className: "border-line bg-card text-ink", Icon: Info },
  error: {
    role: "alert",
    className: "border-danger/30 bg-danger-soft text-danger",
    Icon: CircleAlert,
  },
  success: {
    role: "status",
    className: "border-success/25 bg-success-soft text-success",
    Icon: CircleCheck,
  },
};

// React Aria Components 1.22 にはインラインの通知の部品がないため、Text を div として描画する
export function Alert({ tone = "info", children }: AlertProps) {
  const { role, className, Icon } = toneStyles[tone];
  return (
    <Text
      elementType="div"
      role={role}
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-base leading-relaxed ${className}`}
    >
      <Icon aria-hidden="true" className="mt-1 size-4 shrink-0" strokeWidth={2} />
      <div className="min-w-0">{children}</div>
    </Text>
  );
}
