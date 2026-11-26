import { ChevronLeft, SendHorizontal } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useParams } from "react-router";
import { useSendMessage } from "../api/queries/messages.ts";
import { useRoom } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Link } from "../components/ui/Link.tsx";
import { MessageField } from "../components/ui/MessageField.tsx";
import { Noren } from "../components/ui/Noren.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";
import { ChatMessages } from "./ChatMessages.tsx";
import { InviteButton, MembersButton, MembersPanel } from "./RoomMembers.tsx";
import { RoomSidebar } from "./RoomSidebar.tsx";

// バックエンドの URL は room_id を正の整数としてだけ受け付ける
function parseRoomId(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const roomId = Number(value);
  return Number.isSafeInteger(roomId) ? roomId : null;
}

function CenterMessage({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-md px-4 pt-[12vh]">{children}</div>;
}

function RoomNotFound() {
  return (
    <CenterMessage>
      <div className="border-rule bg-paper rounded-xl border p-6">
        <h2 className="text-kachi text-lg font-bold">ルームが見つかりません</h2>
        <p className="text-nezumi mt-1.5 mb-5 text-sm leading-relaxed">
          URL が正しいか確かめてください。招待されていないルームは開けません。
        </p>
        <Link variant="secondary" href="/">
          ルームの一覧に戻る
        </Link>
      </div>
    </CenterMessage>
  );
}

function MessageForm({ roomId, roomName }: { roomId: number; roomName: string }) {
  // edits は入力が変わるたびに増える。同じ本文を打ち直した場合も含めて、送信の途中に入力が変わったかをこの回数で見分ける
  const [draft, setDraft] = useState({ body: "", edits: 0 });
  const sendMessage = useSendMessage(roomId);
  const submitLock = useSubmitLock();
  // 送った値から入力が変わったら、その値への誤りは出さない
  const validationErrors =
    sendMessage.data?.status === "invalid" && sendMessage.variables?.body === draft.body
      ? sendMessage.data.errors
      : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 送信の途中は送信のボタンが submit でなくなるが、Enter での送信は止まらない
    if (!submitLock.acquire()) {
      return;
    }
    const editsAtSend = draft.edits;
    sendMessage.mutate(
      { body: draft.body },
      {
        onSuccess: (result) => {
          if (result.status === "sent") {
            // 送信の途中に打ち始めた次の本文は残す
            setDraft((current) =>
              current.edits === editsAtSend ? { body: "", edits: current.edits + 1 } : current,
            );
          }
        },
        onSettled: submitLock.release,
      },
    );
  }

  function handleChange(value: string) {
    setDraft((current) => ({ body: value, edits: current.edits + 1 }));
  }

  return (
    <div className="border-rule bg-aijiro shrink-0 border-t">
      <div className="mx-auto max-w-3xl space-y-2 px-3 pt-3 pb-3 sm:px-6 sm:pb-4">
        {sendMessage.isError ? (
          <Alert tone="error">
            メッセージを送信できませんでした。入力した内容は残っています。もう一度送信してください。
          </Alert>
        ) : null}
        <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
          {/* 本文の文字数の上限はバックエンドだけが検査し、超えたら 400 の body の誤りで返る */}
          <MessageField
            name="body"
            label="メッセージ"
            placeholder={`${roomName} にメッセージを送信`}
            hint="Enter で送信、Shift + Enter で改行"
            value={draft.body}
            onChange={handleChange}
            isRequired
            action={
              <Button type="submit" size="sm" isPending={sendMessage.isPending}>
                <SendHorizontal aria-hidden="true" className="size-4" />
                送信
              </Button>
            }
          />
        </Form>
      </div>
    </div>
  );
}

function ChatRoom({ roomId }: { roomId: number }) {
  const room = useRoom(roomId);

  if (room.isPending) {
    return (
      <CenterMessage>
        <p role="status" className="text-nezumi text-center text-sm">
          ルームを読み込んでいます…
        </p>
      </CenterMessage>
    );
  }
  // 取り直しが失敗しても、前に取れたルームがあれば画面を出したままにする
  if (room.data === undefined) {
    return (
      <CenterMessage>
        <Alert tone="error">
          ルームを読み込めませんでした。しばらくしてから、ページを再読み込みしてください。
        </Alert>
      </CenterMessage>
    );
  }
  if (room.data === null) {
    return <RoomNotFound />;
  }
  return (
    <>
      <section aria-label={room.data.name} className="flex min-w-0 flex-1 flex-col">
        <Noren>
          <span className="lg:hidden">
            <Link variant="onDark" href="/" aria-label="ルームの一覧">
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Link>
          </span>
          <h2 className="min-w-0 flex-1 truncate text-lg font-bold tracking-wide">
            {room.data.name}
          </h2>
          <MembersButton roomId={roomId} />
          <InviteButton roomId={roomId} />
        </Noren>
        <ChatMessages roomId={roomId} />
        <MessageForm roomId={roomId} roomName={room.data.name} />
      </section>
      <MembersPanel roomId={roomId} />
    </>
  );
}

export function ChatPage() {
  const roomId = parseRoomId(useParams().roomId);
  return (
    <div className="flex h-full">
      <RoomSidebar currentRoomId={roomId} />
      {roomId === null ? <RoomNotFound /> : <ChatRoom key={roomId} roomId={roomId} />}
    </div>
  );
}
