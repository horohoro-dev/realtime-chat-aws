import type { ReactNode } from "react";
import { RouterProvider } from "react-aria-components";
import { useNavigate } from "react-router";

type LinkRouterProviderProps = {
  children: ReactNode;
};

// React Router の basename を使っていないので、href は書いたパスのまま a 要素に出る
export function LinkRouterProvider({ children }: LinkRouterProviderProps) {
  const navigate = useNavigate();

  function navigateLink(path: string) {
    // /api/ の下はサーバーが返す画面（ログインなど）なので、ブラウザに読み込ませる
    if (path.startsWith("/api/")) {
      window.location.assign(path);
      return;
    }
    void navigate(path);
  }

  return <RouterProvider navigate={navigateLink}>{children}</RouterProvider>;
}
