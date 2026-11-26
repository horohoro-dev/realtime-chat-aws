import { useQuery } from "@tanstack/react-query";
import { client } from "../client.ts";
import { createApiError } from "../errors.ts";

export const meKeys = {
  all: ["me"] as const,
};

// 未ログインのとき API は 403 を返す。null を未ログインとして返し、再試行させない
export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    queryFn: async () => {
      const { data, response } = await client.GET("/api/me/");
      if (response.status === 403) {
        return null;
      }
      if (data === undefined) {
        throw createApiError(`GET /api/me/ が失敗しました（${response.status}）`, response.status);
      }
      return data;
    },
  });
}
