import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../client.ts";
import { createApiError } from "../errors.ts";
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// DRF は入力の誤りを {"項目名": ["メッセージ", ...]} の形で返す
function toFieldErrors(body: unknown): MessageFieldErrors {
  if (typeof body !== "object" || body === null || !("body" in body)) {
    return {};
  }
  return isStringArray(body.body) && body.body.length > 0 ? { body: body.body } : {};
}

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
    refetchInterval: MESSAGES_REFETCH_INTERVAL_MS,
  });
}

// 400 の body の誤りは、項目ごとの誤りとして返す
export function useSendMessage(roomId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: MessageRequest): Promise<SendMessageResult> => {
      const { data, error, response } = await client.POST("/api/rooms/{room_id}/messages/", {
        params: { path: { room_id: roomId } },
        body,
      });
      const errors = response.status === 400 ? toFieldErrors(error) : {};
      if (errors.body !== undefined) {
        return { status: "invalid", errors };
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
