import { useRooms } from "../api/queries/rooms.ts";
import { Alert } from "../components/ui/Alert.tsx";
import { Link } from "../components/ui/Link.tsx";

function RoomList() {
  const rooms = useRooms();

  if (rooms.isPending) {
    return (
      <p role="status" className="text-sm text-gray-600">
        ルームを読み込んでいます…
      </p>
    );
  }
  if (rooms.isError) {
    return (
      <Alert tone="error">
        ルームの一覧を取得できませんでした。時間をおいて、ページを読み込み直してください。
      </Alert>
    );
  }
  if (rooms.data.length === 0) {
    return <p className="text-sm text-gray-600">参加しているルームはまだありません。</p>;
  }
  return (
    <ul className="space-y-2">
      {rooms.data.map((room) => (
        <li key={room.id}>
          <Link href={`/rooms/${room.id}`}>{room.name}</Link>
        </li>
      ))}
    </ul>
  );
}

export function RoomListPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ルームの一覧</h2>
      <Link href="/rooms/new">ルームを作る</Link>
      <RoomList />
    </div>
  );
}
