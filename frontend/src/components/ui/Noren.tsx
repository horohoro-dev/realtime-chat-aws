import type { ReactNode } from "react";

type NorenProps = {
  children: ReactNode;
};

// ルームの見出しを、上のバーから下がる暖簾として描く。下端の切れ目は布の分かれ目で、狭い画面では3枚、広い画面では5枚に分ける
export function Noren({ children }: NorenProps) {
  return (
    <header className="shrink-0">
      <div className="bg-ai flex min-h-14 items-center gap-2 px-3 py-2.5 text-white sm:px-5">
        {children}
      </div>
      <div aria-hidden="true" className="flex h-4 gap-1">
        <span className="bg-ai flex-1" />
        <span className="bg-ai flex-1" />
        <span className="bg-ai flex-1" />
        <span className="bg-ai hidden flex-1 sm:block" />
        <span className="bg-ai hidden flex-1 sm:block" />
      </div>
    </header>
  );
}
