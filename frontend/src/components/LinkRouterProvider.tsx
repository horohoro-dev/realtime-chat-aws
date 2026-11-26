import type { ReactNode } from "react";
import { RouterProvider } from "react-aria-components";
import { useNavigate } from "react-router";

type LinkRouterProviderProps = {
  children: ReactNode;
};

// /api/ の下はサーバーが返す画面（ログインなど）なので、ブラウザに読み込ませる
function useLinkNavigate() {
  const navigate = useNavigate();
  return (path: string) => {
    if (path.startsWith("/api/")) {
      window.location.assign(path);
      return;
    }
    void navigate(path);
  };
}

// React Router の basename を使っていないので、href は書いたパスのまま a 要素に出る
export function LinkRouterProvider({ children }: LinkRouterProviderProps) {
  const navigate = useLinkNavigate();
  return <RouterProvider navigate={navigate}>{children}</RouterProvider>;
}
