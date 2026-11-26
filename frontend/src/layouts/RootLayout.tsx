import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { useMe } from "../api/queries/me.ts";
import { LinkRouterProvider } from "../components/LinkRouterProvider.tsx";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Link } from "../components/ui/Link.tsx";
import { RoomMark } from "../components/ui/RoomMark.tsx";

function loginUrl(next: string) {
  return `/api/auth/login/?next=${encodeURIComponent(next)}`;
}

function CenteredPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-start justify-center overflow-y-auto px-4 pt-[14vh]">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function SignedOut() {
  const location = useLocation();
  return (
    <CenteredPanel>
      <div
        role="status"
        className="border-rule bg-paper space-y-4 rounded-xl border p-6 shadow-[0_1px_2px_oklch(0.23_0.045_266/0.06)]"
      >
        <RoomMark name="チ" />
        <div className="space-y-1.5">
          <p className="text-kachi text-lg font-bold">ログインが必要です</p>
          <p className="text-nezumi text-sm leading-relaxed">
            ルームの会話を読んだり送ったりするには、ログインしてください。
          </p>
        </div>
        <Link
          variant="primary"
          href={loginUrl(`${location.pathname}${location.search}${location.hash}`)}
        >
          ログインする
        </Link>
      </div>
    </CenteredPanel>
  );
}

function AppBar({ username }: { username: string | undefined }) {
  return (
    <div className="bg-kachi flex h-12 shrink-0 items-center justify-between gap-4 px-4 py-2 text-white">
      <h1 className="text-[0.9375rem] font-bold tracking-wide">
        <Link variant="brand" href="/">
          <RoomMark name="チ" size="sm" tone="onDark" />
          チャット
        </Link>
      </h1>
      {username === undefined ? null : (
        <p className="flex items-center gap-2 text-sm text-white/85">
          <Avatar username={username} size="sm" />
          <span className="sr-only sm:not-sr-only">{username} でログイン中</span>
        </p>
      )}
    </div>
  );
}

function Workspace() {
  const me = useMe();

  if (me.isPending) {
    return (
      <CenteredPanel>
        <p role="status" className="text-nezumi text-center text-sm">
          ログイン状態を確認しています…
        </p>
      </CenteredPanel>
    );
  }
  // 取り直しが失敗しても、前に取れた利用者の情報があれば画面を出したままにする
  if (me.data === undefined) {
    return (
      <CenteredPanel>
        <Alert tone="error">
          利用者の情報を読み込めませんでした。しばらくしてから、ページを再読み込みしてください。
        </Alert>
      </CenteredPanel>
    );
  }
  if (me.data === null) {
    return <SignedOut />;
  }
  return <Outlet context={me.data} />;
}

function SignedInBar() {
  const me = useMe();
  return <AppBar username={me.data?.username} />;
}

export function RootLayout() {
  return (
    <LinkRouterProvider>
      <div className="flex h-dvh flex-col">
        <SignedInBar />
        <main className="min-h-0 flex-1">
          <Workspace />
        </main>
      </div>
    </LinkRouterProvider>
  );
}
