import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { App } from "./App.tsx";

it("見出しを表示する", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("チャット");
});
