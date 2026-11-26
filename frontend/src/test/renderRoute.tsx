import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { queryClientConfig } from "../api/queryClient.ts";
import { routes } from "../routes.ts";

// テストごとにキャッシュを分ける。やり直しの判定は本番と同じで、待ち時間だけ 0 にする
export function renderRoute(path: string) {
  const testQueryClient = new QueryClient({
    ...queryClientConfig,
    defaultOptions: {
      ...queryClientConfig.defaultOptions,
      queries: { ...queryClientConfig.defaultOptions?.queries, retryDelay: 0 },
    },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
