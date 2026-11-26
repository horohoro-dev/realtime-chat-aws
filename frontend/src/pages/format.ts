// 日時はブラウザのタイムゾーンで出す
export const dateFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });

export const dayFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export const timeFormat = new Intl.DateTimeFormat("ja-JP", { timeStyle: "short" });

export const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeStyle: "short",
});

export function dayKey(date: Date): string {
  return dayFormat.format(date);
}
