import { UserPlus, Users } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useInviteMember, useMembers } from "../api/queries/members.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Button } from "../components/ui/Button.tsx";
import { DialogTrigger, ModalDialog } from "../components/ui/Dialog.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Loading } from "../components/ui/Loading.tsx";
import { TextField } from "../components/ui/TextField.tsx";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";
import { useCurrentUser } from "../layouts/currentUser.ts";
import { dateFormat } from "./format.ts";

type Member = components["schemas"]["Member"];

function MemberItems({ members, myId }: { members: Member[]; myId: number }) {
  return (
    <ul aria-label="メンバー" className="flex flex-col">
      {members.map((member) => (
        <li key={member.user.id} className="flex items-center gap-3 py-2">
          <Avatar name={member.user.username} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-base">
              <span className="truncate font-medium">{member.user.username}</span>
              {member.user.id === myId ? (
                <span className="bg-surface text-muted shrink-0 rounded-xs px-1.5 text-[13px] font-medium">
                  あなた
                </span>
              ) : null}
            </p>
            <p className="text-muted text-[13px]">
              {dateFormat.format(new Date(member.joined_at))}から参加
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MemberList({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);
  const myId = useCurrentUser().id;

  if (members.isPending) {
    return <Loading>メンバーを読み込んでいます</Loading>;
  }
  return (
    <div className="flex flex-col gap-4">
      {members.isError ? (
        <Alert tone="error">
          メンバーを取得できませんでした。少し待ってから、ページを読み込み直してください。
        </Alert>
      ) : null}
      {members.data === undefined ? null : <MemberItems members={members.data} myId={myId} />}
    </div>
  );
}

export function MembersPanel({ roomId }: { roomId: number }) {
  const headingId = useId();
  const count = useMembers(roomId).data?.length;
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="border-line flex h-18 items-center gap-2 border-b px-6 text-sm font-medium"
      >
        <span className="text-muted">メンバー</span>
        {count === undefined ? null : <span className="text-ink">{count}人</span>}
      </h3>
      <div className="px-6 py-4">
        <MemberList roomId={roomId} />
      </div>
    </section>
  );
}

export function MembersDialog({ roomId }: { roomId: number }) {
  const members = useMembers(roomId).data ?? [];
  const label = members.length > 0 ? `メンバー ${members.length}人` : "メンバー";
  return (
    <DialogTrigger>
      <Button variant="secondary" aria-label={label}>
        {members.length > 0 ? (
          <span className="flex -space-x-2 max-sm:hidden">
            {members.slice(0, 3).map((member) => (
              <span key={member.user.id} className="ring-card flex rounded-full ring-2">
                <Avatar name={member.user.username} size="sm" />
              </span>
            ))}
          </span>
        ) : null}
        <Users aria-hidden="true" className="size-4 sm:hidden" />
        <span>{members.length > 0 ? `${members.length}人` : "メンバー"}</span>
      </Button>
      <ModalDialog title="メンバー" description="加わった順に並んでいます。">
        <MemberList roomId={roomId} />
      </ModalDialog>
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
  const invited =
    inviteMember.data?.status === "invited" && draft.username === ""
      ? inviteMember.data.member.user.username
      : null;

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
    <div className="flex flex-col gap-6">
      {inviteMember.isError ? (
        <Alert tone="error">
          招待できませんでした。入力はそのままです。少し待ってから、もう一度押してください。
        </Alert>
      ) : null}
      {invited === null ? null : (
        <Alert tone="success">
          {invited} をメンバーに加えました。続けてほかの人も招待できます。
        </Alert>
      )}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 利用者がいるか、すでにメンバーかはバックエンドだけが検査し、400 の username の誤りで返る */}
        <TextField
          name="username"
          label="利用者名"
          description="相手がログインに使う名前です。"
          value={draft.username}
          onChange={handleChange}
          autoComplete="off"
          isRequired
          autoFocus
        />
        <div className="flex flex-col sm:flex-row">
          <Button type="submit" isPending={inviteMember.isPending}>
            招待する
          </Button>
        </div>
      </Form>
    </div>
  );
}

export function InviteDialog({ roomId, roomName }: { roomId: number; roomName: string }) {
  return (
    <DialogTrigger>
      <Button variant="secondary" aria-label="メンバーを招待">
        <UserPlus aria-hidden="true" className="size-4" />
        <span className="max-sm:hidden">招待</span>
      </Button>
      <ModalDialog
        title="メンバーを招待"
        description={`「${roomName}」に加える人の利用者名を入れてください。加わった人は、直近の50件のメッセージから読めます。`}
      >
        <InviteForm roomId={roomId} />
      </ModalDialog>
    </DialogTrigger>
  );
}
