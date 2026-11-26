import { useOutletContext } from "react-router";
import type { components } from "../api/schema.d.ts";

type User = components["schemas"]["User"];

// RootLayout はログインを確かめてから、その利用者を Outlet の context に渡して子の画面を描く
export function useSignedInUser(): User {
  return useOutletContext<User>();
}
