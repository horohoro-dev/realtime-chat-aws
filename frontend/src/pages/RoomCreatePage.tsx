import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useCreateRoom } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Link } from "../components/ui/Link.tsx";
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
        // 作成に成功したら、画面が移り終わるまで送信を止めたままにする
        onSuccess: async (result) => {
          if (result.status === "created") {
            await navigate(`/rooms/${result.room.id}`);
          }
          submitLock.release();
        },
        onError: submitLock.release,
      },
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6 sm:py-10">
        <div className="space-y-2">
          <h2 className="text-ink text-xl font-bold">ルームを作る</h2>
          <p className="text-muted text-sm leading-relaxed">
            作ったルームには、あなただけが入っています。作ったあとで、ルームの画面からメンバーを招待できます。
          </p>
        </div>
        {createRoom.isError ? (
          <Alert tone="error">
            ルームを作成できませんでした。接続を確かめて、もう一度「ルームを作る」を押してください。
          </Alert>
        ) : null}
        <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
          {/* 名前の文字数の上限はバックエンドだけが検査し、超えたら 400 の name の誤りで返る */}
          <TextField
            name="name"
            label="ルームの名前"
            description="メンバー全員に表示されます。50文字まで。"
            placeholder="例: 週次の定例"
            value={name}
            onChange={setName}
            isRequired
          />
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link variant="quiet" href="/">
              やめる
            </Link>
            <Button type="submit" isPending={createRoom.isPending}>
              ルームを作る
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
