import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { useMe } from "../api/queries/me.ts";
import { LinkRouterProvider } from "../components/LinkRouterProvider.tsx";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";
import { Seal } from "../components/ui/Seal.tsx";

function loginUrl(next: string) {
  return `/api/auth/login/?next=${encodeURIComponent(next)}`;
}

function SignedInUser() {
  const me = useMe();
  if (me.data === undefined || me.data === null) {
    return null;
  }
  return (
    <div className="text-muted flex items-center gap-2 text-[13px]">
      <span className="max-sm:sr-only">{me.data.username} でログイン中</span>
      <Seal name={me.data.username} size="sm" />
    </div>
  );
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-md px-4 pt-[14vh]">{children}</div>;
}

function MeStatus() {
  const location = useLocation();
  const me = useMe();

  if (me.isPending) {
    return (
      <CenteredMessage>
        <p role="status" className="text-muted text-sm">
          ログインを確かめています…
        </p>
      </CenteredMessage>
    );
  }
  // 取り直しが失敗しても、前に取れた利用者の情報があれば画面を出したままにする
  if (me.data === undefined) {
    return (
      <CenteredMessage>
        <Alert tone="error">
          利用者の情報を取得できませんでした。接続を確かめて、ページを読み込み直してください。
        </Alert>
      </CenteredMessage>
    );
  }
  if (me.data === null) {
    return (
      <CenteredMessage>
        <div
          role="status"
          className="border-rule bg-surface space-y-5 rounded-2xl border p-6 sm:p-8"
        >
          <div className="space-y-2">
            <p className="text-ink text-lg font-bold">ログインしてください</p>
            <p className="text-muted text-sm leading-relaxed">
              ルームとメッセージを見るには、ログインが必要です。ログインのあとは、この画面に戻ります。
            </p>
          </div>
          <Link
            variant="button"
            href={loginUrl(`${location.pathname}${location.search}${location.hash}`)}
          >
            ログインする
          </Link>
        </div>
      </CenteredMessage>
    );
  }
  return (
    <main className="min-h-0 flex-1">
      <Outlet context={me.data} />
    </main>
  );
}

export function RootLayout() {
  return (
    <LinkRouterProvider>
      <div className="flex h-dvh flex-col">
        <header className="border-rule flex h-12 shrink-0 items-center justify-between border-b px-4">
          <h1 className="font-seal text-ink text-lg font-bold tracking-[0.08em]">チャット</h1>
          <SignedInUser />
        </header>
        <MeStatus />
      </div>
    </LinkRouterProvider>
  );
}
