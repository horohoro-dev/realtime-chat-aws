function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// DRF は入力の誤りを {"項目名": ["メッセージ", ...]} の形で返す
export function fieldErrorMessages(body: unknown, field: string): string[] | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const messages: unknown = Reflect.get(body, field);
  return isStringArray(messages) && messages.length > 0 ? messages : undefined;
}
