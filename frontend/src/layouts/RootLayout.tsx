import { MessageSquare } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Outlet, useLocation } from "react-router";
import { useMe } from "../api/queries/me.ts";
import { LinkRouterProvider } from "../components/LinkRouterProvider.tsx";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Link, LinkButton } from "../components/ui/Link.tsx";
import { Loading } from "../components/ui/Loading.tsx";

function loginUrl(next: string) {
  return `/api/auth/login/?next=${encodeURIComponent(next)}`;
}

function CenteredNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full items-start justify-center px-4 py-16 sm:items-center sm:px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function SignedOut() {
  const location = useLocation();
  return (
    <CenteredNotice>
      <div role="status" className="border-line bg-card rounded-lg border p-6 text-center sm:p-8">
        <p className="text-xl font-semibold tracking-tight">ログインしていません</p>
        <p className="text-muted mt-2 text-base leading-relaxed">
          ルームとメッセージは、ログインした人にだけ見えます。
        </p>
        <div className="mt-6 flex justify-center">
          <LinkButton href={loginUrl(`${location.pathname}${location.search}${location.hash}`)}>
            ログインする
          </LinkButton>
        </div>
      </div>
    </CenteredNotice>
  );
}

function Header({ username }: { username: string | undefined }) {
  return (
    <header className="border-line bg-card z-10 shrink-0 border-b">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <h1 className="text-base font-semibold tracking-tight">
          <Link href="/" variant="quiet">
            <span className="bg-ink inline-flex size-7 items-center justify-center rounded-sm text-white">
              <MessageSquare aria-hidden="true" className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-ink">チャット</span>
          </Link>
        </h1>
        {username === undefined ? null : (
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <Avatar name={username} size="sm" />
            <span className="truncate">
              <span className="font-medium">{username}</span>
              <span className="text-muted max-sm:sr-only"> でログイン中</span>
            </span>
          </p>
        )}
      </div>
    </header>
  );
}

function Page({ username, children }: { username?: string; children: ReactNode }) {
  const mainId = useId();
  return (
    <div className="bg-ground text-ink flex h-dvh flex-col">
      <a
        href={`#${mainId}`}
        className="bg-ink sr-only z-30 rounded-sm px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        本文へ移動
      </a>
      <Header username={username} />
      <main id={mainId} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
        {children}
      </main>
    </div>
  );
}

function MeGate() {
  const me = useMe();

  if (me.isPending) {
    return (
      <Page>
        <CenteredNotice>
          <Loading>ログインを確かめています</Loading>
        </CenteredNotice>
      </Page>
    );
  }
  // 取り直しが失敗しても、前に取れた利用者の情報があれば画面を出したままにする
  if (me.data === undefined) {
    return (
      <Page>
        <CenteredNotice>
          <Alert tone="error">
            利用者の情報を取得できませんでした。少し待ってから、ページを読み込み直してください。
          </Alert>
        </CenteredNotice>
      </Page>
    );
  }
  if (me.data === null) {
    return (
      <Page>
        <SignedOut />
      </Page>
    );
  }
  return (
    <Page username={me.data.username}>
      <Outlet context={me.data} />
    </Page>
  );
}

export function RootLayout() {
  return (
    <LinkRouterProvider>
      <MeGate />
    </LinkRouterProvider>
  );
}
