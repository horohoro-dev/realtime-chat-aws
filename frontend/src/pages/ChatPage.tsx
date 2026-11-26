import { ArrowLeft, SendHorizontal } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useParams } from "react-router";
import { useMembers } from "../api/queries/members.ts";
import { useSendMessage } from "../api/queries/messages.ts";
import { useRoom } from "../api/queries/rooms.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Link, LinkButton } from "../components/ui/Link.tsx";
import { Loading } from "../components/ui/Loading.tsx";
import { MessageField } from "../components/ui/TextField.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";
import { useCurrentUser } from "../layouts/currentUser.ts";
import { MessageList } from "./ChatMessages.tsx";
import { dateFormat } from "./format.ts";
import { InviteDialog, MembersDialog, MembersPanel } from "./RoomMembers.tsx";
import { RoomsNav } from "./RoomsNav.tsx";

type Room = components["schemas"]["Room"];

// バックエンドの URL は room_id を正の整数としてだけ受け付ける
function parseRoomId(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const roomId = Number(value);
  return Number.isSafeInteger(roomId) ? roomId : null;
}

function RoomNotFound() {
  return (
    <div className="m-auto max-w-md px-4 py-16 text-center sm:px-6">
      <h2 className="text-xl font-semibold tracking-tight">ルームが見つかりません</h2>
      <p className="text-muted mt-2 text-base leading-relaxed">
        ルームがないか、あなたがこのルームのメンバーではありません。
      </p>
      <p className="mt-6">
        <Link href="/">ルームの一覧へ戻る</Link>
      </p>
    </div>
  );
}

function RoomHeader({ room }: { room: Room }) {
  const memberCount = useMembers(room.id).data?.length;
  return (
    <div className="border-line bg-card flex h-18 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
      <span className="-ml-3 lg:hidden">
        <LinkButton href="/" variant="ghost" shape="square" aria-label="ルームの一覧">
          <ArrowLeft aria-hidden="true" className="size-5" />
        </LinkButton>
      </span>
      <span className="max-sm:hidden">
        <Avatar name={room.name} shape="room" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold tracking-tight">{room.name}</h2>
        <p className="text-muted truncate text-[13px]">
          {memberCount === undefined ? null : <span>{memberCount}人</span>}
          <span className="max-sm:hidden">
            {memberCount === undefined ? "" : "・"}
            {room.created_by.username} が{dateFormat.format(new Date(room.created_at))}に作成
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="xl:hidden">
          <MembersDialog roomId={room.id} />
        </div>
        <InviteDialog roomId={room.id} roomName={room.name} />
      </div>
    </div>
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
    <div className="border-line bg-card shrink-0 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {sendMessage.isError ? (
          <Alert tone="error">
            メッセージを送れませんでした。本文は入力欄に残っています。少し待ってから、もう一度送ってください。
          </Alert>
        ) : null}
        <Form layout="inline" onSubmit={handleSubmit} validationErrors={validationErrors}>
          {/* 本文の文字数の上限はバックエンドだけが検査し、超えたら 400 の body の誤りで返る */}
          <MessageField
            name="body"
            label="メッセージ"
            placeholder={`${roomName} へのメッセージ`}
            value={draft.body}
            onChange={handleChange}
            isRequired
          />
          <Button type="submit" isPending={sendMessage.isPending}>
            <SendHorizontal aria-hidden="true" className="size-4" />
            <span className="max-sm:sr-only">送信する</span>
          </Button>
        </Form>
        <p className="text-muted text-[13px] max-sm:hidden">
          Enter で送信、Shift + Enter で改行。2000文字まで送れます。
        </p>
      </div>
    </div>
  );
}

function ChatRoom({ roomId }: { roomId: number }) {
  const room = useRoom(roomId);
  const myId = useCurrentUser().id;

  if (room.isPending) {
    return (
      <div className="m-auto">
        <Loading>ルームを読み込んでいます</Loading>
      </div>
    );
  }
  // 取り直しが失敗しても、前に取れたルームがあれば画面を出したままにする
  if (room.data === undefined) {
    return (
      <div className="m-auto w-full max-w-md px-4 sm:px-6">
        <Alert tone="error">
          ルームを取得できませんでした。少し待ってから、ページを読み込み直してください。
        </Alert>
      </div>
    );
  }
  if (room.data === null) {
    return <RoomNotFound />;
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <RoomHeader room={room.data} />
        <MessageList roomId={roomId} myId={myId} />
        <MessageForm roomId={roomId} roomName={room.data.name} />
      </div>
      <aside className="border-line bg-card hidden w-72 shrink-0 overflow-y-auto border-l xl:block">
        <MembersPanel roomId={roomId} />
      </aside>
    </div>
  );
}

export function ChatPage() {
  const roomId = parseRoomId(useParams().roomId);
  return (
    <div className="flex h-full">
      <div className="border-line bg-card hidden w-72 shrink-0 overflow-y-auto border-r lg:block">
        <RoomsNav currentRoomId={roomId} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {roomId === null ? <RoomNotFound /> : <ChatRoom key={roomId} roomId={roomId} />}
      </div>
    </div>
  );
}
