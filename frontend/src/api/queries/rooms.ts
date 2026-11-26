import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../client.ts";
import { createApiError } from "../errors.ts";
import { fieldErrorMessages } from "../fieldErrors.ts";
import type { components } from "../schema.d.ts";

type Room = components["schemas"]["Room"];
type RoomRequest = components["schemas"]["RoomRequest"];

export type RoomFieldErrors = Partial<Record<keyof RoomRequest, string[]>>;

export type CreateRoomResult =
  | { status: "created"; room: Room }
  | { status: "invalid"; errors: RoomFieldErrors };

export const roomKeys = {
  all: ["rooms"] as const,
  list: () => [...roomKeys.all, "list"] as const,
  detail: (roomId: number) => [...roomKeys.all, "detail", roomId] as const,
};

export function useRooms() {
  return useQuery({
    queryKey: roomKeys.list(),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/rooms/");
      if (data === undefined) {
        throw createApiError(
          `GET /api/rooms/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return data;
    },
  });
}

// ルームがないときと、自分がメンバーでないときは、API が 404 を返す。どちらも null として返す
export function useRoom(roomId: number) {
  return useQuery({
    queryKey: roomKeys.detail(roomId),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/rooms/{room_id}/", {
        params: { path: { room_id: roomId } },
      });
      if (response.status === 404) {
        return null;
      }
      if (data === undefined) {
        throw createApiError(
          `GET /api/rooms/${roomId}/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return data;
    },
  });
}

// 400 の name の誤りは、項目ごとの誤りとして返す
export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoomRequest): Promise<CreateRoomResult> => {
      const { data, error, response } = await client.POST("/api/rooms/", { body });
      const messages = response.status === 400 ? fieldErrorMessages(error, "name") : undefined;
      if (messages !== undefined) {
        return { status: "invalid", errors: { name: messages } };
      }
      if (data === undefined) {
        throw createApiError(
          `POST /api/rooms/ が失敗しました（${response.status}）`,
          response.status,
        );
      }
      return { status: "created", room: data };
    },
    onSuccess: async (result) => {
      if (result.status === "created") {
        await queryClient.invalidateQueries({ queryKey: roomKeys.list() });
      }
    },
  });
}
