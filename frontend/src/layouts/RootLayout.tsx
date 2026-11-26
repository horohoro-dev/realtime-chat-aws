import { Outlet, useLocation } from "react-router";
import { useMe } from "../api/queries/me.ts";
import { LinkRouterProvider } from "../components/LinkRouterProvider.tsx";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";

function loginUrl(next: string) {
  return `/api/auth/login/?next=${encodeURIComponent(next)}`;
}

function MeStatus() {
  const location = useLocation();
  const me = useMe();

  if (me.isPending) {
    return (
      <p role="status" className="text-sm text-gray-600">
        ログインを確かめています…
      </p>
    );
  }
  if (me.isError) {
    return (
      <Alert tone="error">
        利用者の情報を取得できませんでした。時間をおいて、ページを読み込み直してください。
      </Alert>
    );
  }
  if (me.data === null) {
    return (
      <Alert>
        ログインしていません。
        <Link href={loginUrl(`${location.pathname}${location.search}${location.hash}`)}>
          ログインする
        </Link>
      </Alert>
    );
  }
  return (
    <>
      <p className="text-sm text-gray-600">{me.data.username} でログイン中</p>
      <main className="mt-6">
        <Outlet />
      </main>
    </>
  );
}

export function RootLayout() {
  return (
    <LinkRouterProvider>
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">チャット</h1>
        <MeStatus />
      </div>
    </LinkRouterProvider>
  );
}
