import { useOutletContext } from "react-router";
import type { components } from "../api/schema.d.ts";

type User = components["schemas"]["User"];

// RootLayout はログインを確かめたあとで、ログイン中の利用者を Outlet の context に渡す
export function useSignedInUser(): User {
  return useOutletContext<User>();
}
