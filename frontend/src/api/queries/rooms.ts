import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../client.ts";
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
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// DRF は入力の誤りを {"項目名": ["メッセージ", ...]} の形で返す
function toFieldErrors(body: unknown): RoomFieldErrors {
  if (typeof body !== "object" || body === null || !("name" in body)) {
    return {};
  }
  return isStringArray(body.name) ? { name: body.name } : {};
}

export function useRooms() {
  return useQuery({
    queryKey: roomKeys.list(),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/rooms/");
      if (data === undefined) {
        throw new Error(`GET /api/rooms/ が失敗しました（${response.status}）`);
      }
      return data;
    },
  });
}

// 400 は画面で入力欄に出すため、例外にせず invalid として返す
export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoomRequest): Promise<CreateRoomResult> => {
      const { data, error, response } = await client.POST("/api/rooms/", { body });
      if (response.status === 400) {
        return { status: "invalid", errors: toFieldErrors(error) };
      }
      if (data === undefined) {
        throw new Error(`POST /api/rooms/ が失敗しました（${response.status}）`);
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
