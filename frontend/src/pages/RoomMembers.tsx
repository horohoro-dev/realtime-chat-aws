import { UserPlus, Users } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useInviteMember, useMembers } from "../api/queries/members.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Dialog, DialogTrigger } from "../components/ui/Dialog.tsx";
import { Form } from "../components/ui/Form.tsx";
import { Skeleton } from "../components/ui/Skeleton.tsx";
import { TextField } from "../components/ui/TextField.tsx";
import { useSignedInUser } from "../hooks/useSignedInUser.ts";
import { useSubmitLock } from "../hooks/useSubmitLock.ts";

type Member = components["schemas"]["Member"];

const joinedDateFormat = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric" });

function MemberItems({ members }: { members: Member[] }) {
  const meId = useSignedInUser().id;
  return (
    <ul aria-label="メンバー" className="space-y-0.5">
      {members.map((member) => (
        <li key={member.user.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <Avatar username={member.user.username} size="sm" />
          <span className="text-sumi min-w-0 flex-1 truncate text-sm">
            {member.user.username}
            {member.user.id === meId ? (
              <span className="bg-kamenozoki text-kon ml-1.5 rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-semibold">
                あなた
              </span>
            ) : null}
          </span>
          <time dateTime={member.joined_at} className="text-nezumi shrink-0 text-xs">
            {joinedDateFormat.format(new Date(member.joined_at))}に参加
          </time>
        </li>
      ))}
    </ul>
  );
}

function MemberList({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);

  if (members.isPending) {
    return <Skeleton label="メンバーを読み込んでいます…" />;
  }
  return (
    <div className="space-y-3">
      {members.isError ? (
        <Alert tone="error">
          メンバーを読み込めませんでした。しばらくしてから、ページを再読み込みしてください。
        </Alert>
      ) : null}
      {members.data === undefined ? null : <MemberItems members={members.data} />}
    </div>
  );
}

function MemberCount({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);
  if (members.data === undefined) {
    return null;
  }
  return <span className="text-nezumi font-normal">{members.data.length}人</span>;
}

export function MembersPanel({ roomId }: { roomId: number }) {
  const headingId = useId();
  return (
    <aside
      aria-labelledby={headingId}
      className="border-rule bg-paper hidden w-64 shrink-0 flex-col border-l xl:flex"
    >
      <h3 id={headingId} className="text-kachi flex h-12 items-center gap-2 px-4 text-sm font-bold">
        メンバー <MemberCount roomId={roomId} />
      </h3>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <MemberList roomId={roomId} />
      </div>
    </aside>
  );
}

function AvatarStack({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);
  const shown = (members.data ?? []).slice(0, 3);
  return (
    <span className="flex -space-x-1.5">
      {shown.map((member) => (
        <span key={member.user.id} className="ring-ai rounded-full ring-2">
          <Avatar username={member.user.username} size="sm" />
        </span>
      ))}
    </span>
  );
}

// 広い画面では右の欄に一覧を出すので、このボタンは狭い画面でだけ出す
export function MembersButton({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);
  const count = members.data?.length;
  return (
    <span className="xl:hidden">
      <DialogTrigger>
        <Button
          variant="onDark"
          size="sm"
          aria-label={count === undefined ? "メンバー" : `メンバー（${count}人）`}
        >
          <span className="hidden sm:contents">
            <AvatarStack roomId={roomId} />
          </span>
          <Users aria-hidden="true" className="size-4 sm:hidden" />
          {count === undefined ? null : <span className="tabular-nums">{count}</span>}
        </Button>
        <Dialog title="メンバー">
          <MemberList roomId={roomId} />
        </Dialog>
      </DialogTrigger>
    </span>
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
  const invited = inviteMember.data?.status === "invited" ? inviteMember.data.member : null;

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
      {inviteMember.isError ? (
        <Alert tone="error">
          招待できませんでした。入力した利用者名は残っています。しばらくしてから、もう一度お試しください。
        </Alert>
      ) : null}
      {invited === null || inviteMember.isPending ? null : (
        <Alert tone="success">
          {invited.user.username} さんをメンバーに加えました。続けてほかの人も招待できます。
        </Alert>
      )}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 利用者がいるか、すでにメンバーかはバックエンドだけが検査し、400 の username の誤りで返る */}
        <TextField
          name="username"
          label="利用者名"
          placeholder="例：tanaka"
          value={draft.username}
          onChange={handleChange}
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
      <Button variant="onDark" size="sm">
        <UserPlus aria-hidden="true" className="size-4" />
        <span className="sr-only sm:not-sr-only">メンバーを招待</span>
      </Button>
      <Dialog
        title="メンバーを招待"
        description="招待する人の利用者名を入力してください。招待した人は、このルームの会話を読み書きできるようになります。"
      >
        <InviteForm roomId={roomId} />
      </Dialog>
    </DialogTrigger>
  );
}
