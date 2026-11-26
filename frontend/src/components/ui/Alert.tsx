import type { ReactNode } from "react";
import { Text } from "react-aria-components";

type AlertTone = "info" | "error";

type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
};

const toneStyles: Record<AlertTone, { role: "status" | "alert"; className: string }> = {
  // リンクなど操作できる要素を含むので、読み上げを割り込ませない status にする
  info: { role: "status", className: "border-sky-300 bg-sky-50 text-sky-900" },
  error: { role: "alert", className: "border-red-300 bg-red-50 text-red-900" },
};

// React Aria Components 1.22 にはインラインの通知の部品がないため、Text を div として描画する
export function Alert({ tone = "info", children }: AlertProps) {
  const { role, className } = toneStyles[tone];
  return (
    <Text
      elementType="div"
      role={role}
      className={`rounded-md border px-4 py-3 text-sm ${className}`}
    >
      {children}
    </Text>
  );
}
