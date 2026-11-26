import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useCreateRoom } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { TextField } from "../components/ui/TextField.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";

export function RoomCreatePage() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();
  const submitLock = useSubmitLock();
  const [name, setName] = useState("");
  const validationErrors =
    createRoom.data?.status === "invalid" && createRoom.variables?.name === name
      ? createRoom.data.errors
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React Aria の Button は isPending の間 submit を止めるが、入力欄での Enter による送信は止めない
    if (!submitLock.acquire()) {
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
        // 作成に成功したら画面が移るので、移るまでのあいだ送信を止めたままにする
        onSettled: (result) => {
          if (result?.status !== "created") {
            submitLock.release();
          }
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ルームの作成</h2>
      {createRoom.isError ? (
        <Alert tone="error">
          ルームを作成できませんでした。時間をおいて、もう一度お試しください。
        </Alert>
      ) : null}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 名前の文字数の上限はバックエンドだけが検査し、超えたら 400 の name の誤りで返る */}
        <TextField name="name" label="ルームの名前" value={name} onChange={setName} isRequired />
        <Button type="submit" isPending={createRoom.isPending}>
          作成する
        </Button>
      </Form>
    </div>
  );
}
