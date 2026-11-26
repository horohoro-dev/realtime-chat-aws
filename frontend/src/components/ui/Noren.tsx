import type { ReactNode } from "react";

type NorenProps = {
  children: ReactNode;
};

// ルームの見出しを、上のバーから下がる藍の暖簾として描く
export function Noren({ children }: NorenProps) {
  return (
    <header className="bg-ai flex min-h-14 shrink-0 items-center gap-2 px-3 py-2.5 text-white sm:px-5">
      {children}
    </header>
  );
}
