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
