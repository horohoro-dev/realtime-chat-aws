import { describe, expect, it } from "vitest";
import { fieldErrorMessages } from "./fieldErrors.ts";

describe("fieldErrorMessages", () => {
  it("指定した項目の誤りのメッセージを返す", () => {
    const body = { name: ["長すぎます。"], detail: "x" };
    expect(fieldErrorMessages(body, "name")).toEqual(["長すぎます。"]);
  });

  it.each([
    ["項目がない", { detail: "入力が正しくありません。" }],
    ["空の配列", { name: [] }],
    ["文字列でない要素", { name: [1] }],
    ["オブジェクトでない", "エラー"],
    ["null", null],
  ])("%s ときは undefined を返す", (_label, body) => {
    expect(fieldErrorMessages(body, "name")).toBeUndefined();
  });
});
