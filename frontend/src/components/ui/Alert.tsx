import type { ReactNode } from "react";
import { Text } from "react-aria-components";

type AlertTone = "info" | "success" | "error";

type AlertProps = {
  tone?: AlertTone;
  children: ReactNode;
};

const toneStyles: Record<AlertTone, { role: "status" | "alert"; className: string }> = {
  // リンクなど操作できる要素を含むので、読み上げを割り込ませない status にする
  info: { role: "status", className: "border-l-ai bg-ai-soft/60 text-ink" },
  success: { role: "status", className: "border-l-matsu bg-matsu-soft text-ink" },
  error: { role: "alert", className: "border-l-shu bg-shu-soft text-shu-deep" },
};

// React Aria Components 1.22 にはインラインの通知の部品がないため、Text を div として描画する
export function Alert({ tone = "info", children }: AlertProps) {
  const { role, className } = toneStyles[tone];
  return (
    <Text
      elementType="div"
      role={role}
      className={`rounded-lg border-l-4 px-4 py-3 text-sm leading-relaxed ${className}`}
    >
      {children}
    </Text>
  );
}
