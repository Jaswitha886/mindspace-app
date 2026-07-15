// Date/time display helpers — appointment dates are midnight UTC, times are
// "HH:mm" strings, so format in UTC to avoid off-by-one-day shifts.
// Display conventions follow the reference export: "10:00 AM - 11:00 AM" and
// "Tuesday, October 26, 2024".

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Long form, used on appointment cards.
export function formatDateLong(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatDateTimeRange(date: Date | string, start: string, end: string) {
  return `${formatDate(date)}, ${formatTimeRange(start, end)}`;
}
