import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" variant="quiet">
        <ArrowLeft aria-hidden="true" className="size-4" />
        ルームの一覧
      </Link>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">ルームを作る</h2>
      <p className="text-muted mt-1 text-base leading-relaxed">
        作った人が最初のメンバーになります。ほかの人は、ルームの中から招待できます。
      </p>
      <div className="border-line bg-card mt-8 rounded-lg border p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          {createRoom.isError ? (
            <Alert tone="error">
              ルームを作成できませんでした。入力はそのままです。少し待ってから、もう一度押してください。
            </Alert>
          ) : null}
          <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
            {/* 名前の文字数の上限はバックエンドだけが検査し、超えたら 400 の name の誤りで返る */}
            <TextField
              name="name"
              label="ルームの名前"
              description="50文字まで。あとから変えることはできません。"
              value={name}
              onChange={setName}
              isRequired
            />
            <div className="flex flex-col sm:flex-row">
              <Button type="submit" isPending={createRoom.isPending}>
                ルームを作る
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
