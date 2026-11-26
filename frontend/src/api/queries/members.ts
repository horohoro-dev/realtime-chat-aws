import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../client.ts";
import { createApiError } from "../errors.ts";
import { fieldErrorMessages } from "../fieldErrors.ts";
import type { components } from "../schema.d.ts";
import { roomKeys } from "./rooms.ts";

type Member = components["schemas"]["Member"];
type MemberRequest = components["schemas"]["MemberRequest"];

export type MemberFieldErrors = Partial<Record<keyof MemberRequest, string[]>>;

export type InviteMemberResult =
  | { status: "invited"; member: Member }
  | { status: "invalid"; errors: MemberFieldErrors };

export const memberKeys = {
  list: (roomId: number) => [...roomKeys.detail(roomId), "members"] as const,
};

// API はメンバーを加わった順に返す
export function useMembers(roomId: number) {
  return useQuery({
    queryKey: memberKeys.list(roomId),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/rooms/{room_id}/members/", {
        params: { path: { room_id: roomId } },
      });
      if (data === undefined) {
        throw createApiError(
          `GET /api/rooms/${roomId}/members/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return data;
    },
  });
}

// 利用者がいない、すでにメンバーであるときは、400 の username の誤りとして返す
export function useInviteMember(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: memberKeys.list(roomId),
    mutationFn: async (body: MemberRequest): Promise<InviteMemberResult> => {
      const { data, error, response } = await client.POST("/api/rooms/{room_id}/members/", {
        params: { path: { room_id: roomId } },
        body,
      });
      const messages = response.status === 400 ? fieldErrorMessages(error, "username") : undefined;
      if (messages !== undefined) {
        return { status: "invalid", errors: { username: messages } };
      }
      if (data === undefined) {
        throw createApiError(
          `POST /api/rooms/${roomId}/members/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return { status: "invited", member: data };
    },
    // 「すでにメンバー」の 400 や招待の失敗は、ほかの人の招待で一覧が古くなっているときにも返るので、結果によらず取り直す
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: memberKeys.list(roomId) });
    },
  });
}
