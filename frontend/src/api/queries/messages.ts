import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../client.ts";
import { createApiError, isApiError } from "../errors.ts";
import { fieldErrorMessages } from "../fieldErrors.ts";
import type { components } from "../schema.d.ts";
import { roomKeys } from "./rooms.ts";

type Message = components["schemas"]["Message"];
type MessageRequest = components["schemas"]["MessageRequest"];

export type MessageFieldErrors = Partial<Record<keyof MessageRequest, string[]>>;

export type SendMessageResult =
  | { status: "sent"; message: Message }
  | { status: "invalid"; errors: MessageFieldErrors };

const MESSAGES_REFETCH_INTERVAL_MS = 3000;

export const messageKeys = {
  list: (roomId: number) => [...roomKeys.detail(roomId), "messages"] as const,
};

// API は最新の50件を古い順に返す
export function useMessages(roomId: number) {
  return useQuery({
    queryKey: messageKeys.list(roomId),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/rooms/{room_id}/messages/", {
        params: { path: { room_id: roomId } },
      });
      if (data === undefined) {
        throw createApiError(
          `GET /api/rooms/${roomId}/messages/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return data;
    },
    // 404 はルームがないか、メンバーでないことを表すので、取り直しても変わらない
    refetchInterval: (query) =>
      isApiError(query.state.error) && query.state.error.status === 404
        ? false
        : MESSAGES_REFETCH_INTERVAL_MS,
  });
}

// 400 の body の誤りは、項目ごとの誤りとして返す
export function useSendMessage(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: messageKeys.list(roomId),
    mutationFn: async (body: MessageRequest): Promise<SendMessageResult> => {
      const { data, error, response } = await client.POST("/api/rooms/{room_id}/messages/", {
        params: { path: { room_id: roomId } },
        body,
      });
      const messages = response.status === 400 ? fieldErrorMessages(error, "body") : undefined;
      if (messages !== undefined) {
        return { status: "invalid", errors: { body: messages } };
      }
      if (data === undefined) {
        throw createApiError(
          `POST /api/rooms/${roomId}/messages/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return { status: "sent", message: data };
    },
    onSuccess: async (result) => {
      if (result.status === "sent") {
        await queryClient.invalidateQueries({ queryKey: messageKeys.list(roomId) });
      }
    },
  });
}
