import { toDateKey } from "./utils";

export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return toDateKey(start);
}

export function getMonthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = toDateKey(new Date(y, m - 1, 1));
  const lastDay = new Date(y, m, 0);
  const end = toDateKey(lastDay);
  return { start, end };
}

export function getWeekRange(sundayKey: string): { start: string; end: string } {
  const d = new Date(sundayKey + "T12:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return { start: sundayKey, end: toDateKey(end) };
}

export function getMonthOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    return { value, label };
  });
}

export function getWeekOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - i * 7);
    const value = toDateKey(d);
    const label = `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    return { value, label };
  });
}
