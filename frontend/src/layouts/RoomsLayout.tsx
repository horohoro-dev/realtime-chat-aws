import { Plus } from "lucide-react";
import { Outlet, useMatch, useParams } from "react-router";
import { useRooms } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";
import { Seal } from "../components/ui/Seal.tsx";
import { useSignedInUser } from "./signedInUser.ts";

function RoomNavItems({ currentRoomId }: { currentRoomId: string | undefined }) {
  const rooms = useRooms();

  if (rooms.isPending) {
    return (
      <p role="status" className="text-muted px-3 text-[13px]">
        読み込んでいます…
      </p>
    );
  }
  if (rooms.isError) {
    return <Alert tone="error">ルームの一覧を取得できませんでした。</Alert>;
  }
  if (rooms.data.length === 0) {
    return <p className="text-muted px-3 text-[13px]">参加しているルームはありません。</p>;
  }
  return (
    <ul className="space-y-0.5">
      {rooms.data.map((room) => (
        <li key={room.id}>
          <Link
            variant="nav"
            href={`/rooms/${room.id}`}
            aria-current={String(room.id) === currentRoomId ? "page" : undefined}
          >
            <Seal name={room.name} size="sm" shape="square" />
            <span className="truncate">{room.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// 広い画面では、ルームの列を左に出したまま、ルームを行き来できるようにする。
// 狭い画面ではこの列を出さず、ルームの一覧の画面（/）から選ぶ
export function RoomsLayout() {
  const { roomId } = useParams();
  const isCreating = useMatch("/rooms/new") !== null;
  const me = useSignedInUser();
  return (
    <div className="flex h-full">
      <nav
        aria-label="参加しているルーム"
        className="border-rule hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r px-3 py-4 md:flex"
      >
        <p className="text-muted px-3 text-[13px] font-semibold">参加しているルーム</p>
        <RoomNavItems currentRoomId={roomId} />
        <div className="border-rule mt-auto border-t pt-3">
          <Link variant="nav" href="/rooms/new" aria-current={isCreating ? "page" : undefined}>
            <Plus aria-hidden="true" className="text-muted size-4" />
            ルームを作る
          </Link>
        </div>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet context={me} />
      </div>
    </div>
  );
}
