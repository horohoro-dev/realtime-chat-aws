const timeFormat = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" });
const fullFormat = new Intl.DateTimeFormat("ja-JP", { dateStyle: "full", timeStyle: "short" });
const dayFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
});
const dayWithYearFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const shortDateFormat = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric" });
const shortDateWithYearFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function isThisYear(date: Date): boolean {
  return date.getFullYear() === new Date().getFullYear();
}

// 例: 09:05
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

// 例: 2026年11月3日火曜日 9:05
export function formatFullDateTime(iso: string): string {
  return fullFormat.format(new Date(iso));
}

// 例: 11月3日(火)。今年でなければ年も付ける
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return (isThisYear(date) ? dayFormat : dayWithYearFormat).format(date);
}

// 例: 11月3日。今年でなければ年も付ける
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return (isThisYear(date) ? shortDateFormat : shortDateWithYearFormat).format(date);
}

// 日付の区切りを入れるかの判定に使う。表示と同じタイムゾーンで日付を比べる
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
