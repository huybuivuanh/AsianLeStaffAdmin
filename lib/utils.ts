export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Sort items alphabetically by a string key.
 * Uses localeCompare for correct alphabetical ordering.
 */
export function sortByAlphabet<T>(
  items: T[],
  getKey: (item: T) => string,
): T[] {
  return [...items].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), undefined, { sensitivity: "base" }),
  );
}
