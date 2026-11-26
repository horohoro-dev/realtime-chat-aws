import { ChevronLeft } from "lucide-react";
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
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
        <Link variant="quiet" href="/">
          <ChevronLeft aria-hidden="true" className="size-4" />
          ルームの一覧
        </Link>
        <div className="border-rule bg-paper mt-4 rounded-xl border p-5 shadow-[0_1px_2px_oklch(0.23_0.045_266/0.06)] sm:p-6">
          <h2 className="text-kachi text-xl font-bold">新しいルーム</h2>
          <p className="text-nezumi mt-1.5 mb-6 text-sm leading-relaxed">
            作ったあと、ルームの画面からメンバーを招待できます。
          </p>
          <div className="space-y-5">
            {createRoom.isError ? (
              <Alert tone="error">
                ルームを作成できませんでした。入力した名前は残っています。しばらくしてから、もう一度お試しください。
              </Alert>
            ) : null}
            <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
              {/* 名前の文字数の上限はバックエンドだけが検査し、超えたら 400 の name の誤りで返る */}
              <TextField
                name="name"
                label="ルーム名"
                description="50文字まで。メンバー全員に表示されます。"
                placeholder="例：週次定例"
                value={name}
                onChange={setName}
                isRequired
              />
              <div className="flex justify-end gap-2">
                <Link variant="secondary" href="/">
                  キャンセル
                </Link>
                <Button type="submit" isPending={createRoom.isPending}>
                  ルームを作成
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
