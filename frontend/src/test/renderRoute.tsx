import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createQueryClient } from "../api/queryClient.ts";
import { routes } from "../routes.ts";

// テストごとにキャッシュを分ける。設定は本番と同じで、やり直しの待ち時間だけ 0 にする
export function renderRoute(path: string) {
  const testQueryClient = createQueryClient({ retryDelay: 0 });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
