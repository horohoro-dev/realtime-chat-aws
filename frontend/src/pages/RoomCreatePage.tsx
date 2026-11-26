import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useCreateRoom } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { TextField } from "../components/ui/TextField.tsx";

// backend の Room.name の max_length と同じ値
const NAME_MAX_LENGTH = 50;

function useRoomCreateForm() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name !== "string") {
      return;
    }
    createRoom.mutate(
      { name },
      {
        onSuccess: async (result) => {
          if (result.status === "created") {
            await navigate(`/rooms/${result.room.id}`);
          }
        },
      },
    );
  }

  return { createRoom, onSubmit };
}

export function RoomCreatePage() {
  const form = useRoomCreateForm();
  const { createRoom } = form;
  const validationErrors = createRoom.data?.status === "invalid" ? createRoom.data.errors : {};

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ルームの作成</h2>
      {createRoom.isError ? (
        <Alert tone="error">
          ルームを作成できませんでした。時間をおいて、もう一度お試しください。
        </Alert>
      ) : null}
      <Form onSubmit={form.onSubmit} validationErrors={validationErrors}>
        <TextField name="name" label="ルームの名前" isRequired maxLength={NAME_MAX_LENGTH} />
        <Button type="submit" isPending={createRoom.isPending}>
          作成する
        </Button>
      </Form>
    </div>
  );
}
