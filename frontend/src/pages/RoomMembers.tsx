import { type FormEvent, useId, useState } from "react";
import { useInviteMember, useMembers } from "../api/queries/members.ts";
import type { components } from "../api/schema.d.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Form } from "../components/ui/Form.tsx";
import { TextField } from "../components/ui/TextField.tsx";

type Member = components["schemas"]["Member"];

function MemberItems({ members }: { members: Member[] }) {
  return (
    <ul aria-label="メンバー" className="flex flex-wrap gap-2">
      {members.map((member) => (
        <li key={member.user.id} className="rounded-md border border-gray-200 px-3 py-1 text-sm">
          {member.user.username}
        </li>
      ))}
    </ul>
  );
}

function MemberList({ roomId }: { roomId: number }) {
  const members = useMembers(roomId);

  if (members.isPending) {
    return (
      <p role="status" className="text-sm text-gray-600">
        メンバーを読み込んでいます…
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {members.isError ? (
        <Alert tone="error">
          メンバーを取得できませんでした。時間をおいて、ページを読み込み直してください。
        </Alert>
      ) : null}
      {members.data === undefined ? null : <MemberItems members={members.data} />}
    </div>
  );
}

function InviteForm({ roomId }: { roomId: number }) {
  // edits は入力が変わるたびに増える。同じ利用者名を打ち直した場合も含めて、招待の途中に入力が変わったかをこの回数で見分ける
  const [draft, setDraft] = useState({ username: "", edits: 0 });
  const inviteMember = useInviteMember(roomId);
  const validationErrors = inviteMember.data?.status === "invalid" ? inviteMember.data.errors : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React Aria の Button は isPending の間 submit を止めるが、入力欄での Enter による送信は止めない
    if (inviteMember.isPending) {
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
          メンバーを招待できませんでした。時間をおいて、もう一度お試しください。
        </Alert>
      ) : null}
      <Form onSubmit={handleSubmit} validationErrors={validationErrors}>
        {/* 利用者がいるか、すでにメンバーかはバックエンドだけが検査し、400 の username の誤りで返る */}
        <TextField
          name="username"
          label="招待する利用者名"
          value={draft.username}
          onChange={handleChange}
          isRequired
        />
        <Button type="submit" isPending={inviteMember.isPending}>
          招待する
        </Button>
      </Form>
    </div>
  );
}

export function RoomMembers({ roomId }: { roomId: number }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h3 id={headingId} className="text-lg font-semibold">
        メンバー
      </h3>
      <MemberList roomId={roomId} />
      <InviteForm roomId={roomId} />
    </section>
  );
}
