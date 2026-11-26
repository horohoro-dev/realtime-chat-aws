import { UserPlus, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useInviteMember, useMembers } from "../api/queries/members.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Dialog, DialogTrigger } from "../components/ui/Dialog.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Seal } from "../components/ui/Seal.tsx";
import { TextField } from "../components/ui/TextField.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";
import { formatShortDate } from "../lib/dateFormat.ts";

type Member = components["schemas"]["Member"];

const STACKED_SEALS = 4;

type RoomPeople = {
  roomId: number;
  myId: number;
  creatorId: number;
};

function MemberItems({
  members,
  myId,
  creatorId,
}: { members: Member[] } & Omit<RoomPeople, "roomId">) {
  return (
    <ul aria-label="メンバー" className="-mx-2 max-h-[50dvh] overflow-y-auto">
      {members.map((member) => (
        <li key={member.user.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <Seal name={member.user.username} />
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate font-semibold">
              {member.user.username}
              {member.user.id === myId ? (
                <span className="text-muted ml-1.5 text-[13px] font-normal">（あなた）</span>
              ) : null}
            </p>
            <p className="text-muted text-[13px]">
              {formatShortDate(member.joined_at)}
              {member.user.id === creatorId ? "にルームを作成" : "に参加"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MemberList({ roomId, myId, creatorId }: RoomPeople) {
  const members = useMembers(roomId);

  if (members.isPending) {
    return (
      <p role="status" className="text-muted text-sm">
        メンバーを読み込んでいます…
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {members.isError ? (
        <Alert tone="error">
          メンバーを取得できませんでした。接続を確かめて、ページを読み込み直してください。
        </Alert>
      ) : null}
      {members.data === undefined ? null : (
        <MemberItems members={members.data} myId={myId} creatorId={creatorId} />
      )}
    </div>
  );
}

function SealStack({ members }: { members: Member[] }) {
  const shown = members.slice(0, STACKED_SEALS);
  const hidden = members.length - shown.length;
  return (
    <span aria-hidden="true" className="flex items-center -space-x-1 max-sm:hidden">
      {shown.map((member) => (
        <span key={member.user.id} className="ring-paper rounded-full ring-2">
          <Seal name={member.user.username} size="sm" />
        </span>
      ))}
      {hidden > 0 ? (
        <span className="bg-rule text-ink ring-paper inline-flex size-7 items-center justify-center rounded-full text-[11px] font-semibold ring-2">
          +{hidden}
        </span>
      ) : null}
    </span>
  );
}

// ヘッダーには、回覧板の確認印のように参加者の印を並べ、押すと一覧を開く
export function MembersButton(props: RoomPeople) {
  const members = useMembers(props.roomId);
  const count = members.data?.length;
  return (
    <DialogTrigger>
      <Button
        variant="quiet"
        aria-label={count === undefined ? "メンバーを見る" : `メンバーを見る（${count}人）`}
      >
        <Users aria-hidden="true" className="text-muted size-4 sm:hidden" />
        {members.data === undefined ? null : <SealStack members={members.data} />}
        <span className="text-muted text-[13px] tabular-nums">
          {count === undefined ? "メンバー" : `${count}人`}
        </span>
      </Button>
      <Dialog
        title="メンバー"
        description={
          count === undefined ? undefined : `このルームには ${count}人が参加しています。`
        }
      >
        {() => <MemberList {...props} />}
      </Dialog>
    </DialogTrigger>
  );
}

function InviteForm({ roomId }: { roomId: number }) {
  // edits は入力が変わるたびに増える。同じ利用者名を打ち直した場合も含めて、招待の途中に入力が変わったかをこの回数で見分ける
  const [draft, setDraft] = useState({ username: "", edits: 0 });
  const inviteMember = useInviteMember(roomId);
  const submitLock = useSubmitLock();
  // 送った値から入力が変わったら、その値への誤りは出さない
  const validationErrors =
    inviteMember.data?.status === "invalid" && inviteMember.variables?.username === draft.username
      ? inviteMember.data.errors
      : {};
  const invited = inviteMember.data?.status === "invited" ? inviteMember.data.member : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React Aria の Button は isPending の間 submit を止めるが、入力欄での Enter による送信は止めない
    if (!submitLock.acquire()) {
      return;
    }
    const editsAtSend = draft.edits;
    inviteMember.mutate(
      { username: draft.username },
      {
        onSuccess: (result) => {
          if (result.status === "invited") {
            // 招待の途中に打ち始めた次の利用者名は残す
            setDraft((current) =>
              current.edits === editsAtSend ? { username: "", edits: current.edits + 1 } : current,
            );
          }
        },
        onSettled: submitLock.release,
      },
    );
  }

  function handleChange(value: string) {
    setDraft((current) => ({ username: value, edits: current.edits + 1 }));
  }

  return (
    <div className="space-y-4">
      {invited === undefined ? null : (
        <Alert tone="success">
          {invited.user.username} さんを招待しました。続けてほかの人も招待できます。
        </Alert>
      )}
      {inviteMember.isError ? (
        <Alert tone="error">
          メンバーを招待できませんでした。接続を確かめて、もう一度「招待する」を押してください。
        </Alert>
      ) : null}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 利用者がいるか、すでにメンバーかはバックエンドだけが検査し、400 の username の誤りで返る */}
        <TextField
          name="username"
          label="利用者名"
          description="相手がログインに使う名前を入力してください。"
          placeholder="例: tanaka"
          value={draft.username}
          onChange={handleChange}
          autoComplete="off"
          autoFocus
          isRequired
        />
        <div className="flex justify-end">
          <Button type="submit" isPending={inviteMember.isPending}>
            招待する
          </Button>
        </div>
      </Form>
    </div>
  );
}

export function InviteButton({ roomId }: { roomId: number }) {
  return (
    <DialogTrigger>
      <Button variant="secondary" aria-label="メンバーを招待">
        <UserPlus aria-hidden="true" className="size-4" />
        <span className="max-sm:hidden">招待</span>
      </Button>
      <Dialog
        title="メンバーを招待"
        description="招待した人は、このルームのメッセージを読んだり送ったりできるようになります。"
      >
        {() => <InviteForm roomId={roomId} />}
      </Dialog>
    </DialogTrigger>
  );
}
