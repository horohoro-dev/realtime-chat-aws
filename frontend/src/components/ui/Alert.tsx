import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Text } from "react-aria-components";

type AlertTone = "info" | "success" | "error";

type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
};

const toneStyles: Record<
  AlertTone,
  { role: "status" | "alert"; className: string; Icon: typeof Info }
> = {
  // リンクなど操作できる要素を含むので、読み上げを割り込ませない status にする
  info: { role: "status", className: "border-mizu bg-kamenozoki/50 text-kachi", Icon: Info },
  success: {
    role: "status",
    className: "border-mizu bg-kamenozoki/50 text-kachi",
    Icon: CircleCheck,
  },
  error: {
    role: "alert",
    className: "border-akane/30 bg-akane-wash text-akane",
    Icon: CircleAlert,
  },
};

// React Aria Components 1.22 にはインラインの通知の部品がないため、Text を div として描画する
export function Alert({ tone = "info", children }: AlertProps) {
  const { role, className, Icon } = toneStyles[tone];
  return (
    <Text
      elementType="div"
      role={role}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-sm leading-relaxed ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      <div className="text-sumi min-w-0">{children}</div>
    </Text>
  );
}
