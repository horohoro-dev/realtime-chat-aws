import type { RouteObject } from "react-router";
import { RoomsLayout } from "./layouts/RoomsLayout.tsx";
import { RootLayout } from "./layouts/RootLayout.tsx";
import { ChatPage } from "./pages/ChatPage.tsx";
import { RoomCreatePage } from "./pages/RoomCreatePage.tsx";
import { RoomListPage } from "./pages/RoomListPage.tsx";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: RoomListPage },
      {
        Component: RoomsLayout,
        children: [
          { path: "rooms/new", Component: RoomCreatePage },
          { path: "rooms/:roomId", Component: ChatPage },
        ],
      },
    ],
  },
];
