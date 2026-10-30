/**
 * Groups `items` by `key`, keeping both the groups and the items inside them in first-appearance
 * order, so results never depend on hash order. (`Map.groupBy` is not in the ES2023 library
 * WorkoutCore compiles against.)
 */
export function groupBy<Item, Key>(items: readonly Item[], key: (item: Item) => Key): Map<Key, Item[]> {
  const groups = new Map<Key, Item[]>();
  for (const item of items) {
    const groupKey = key(item);
    const group = groups.get(groupKey);
    if (group === undefined) {
      groups.set(groupKey, [item]);
    } else {
      group.push(item);
    }
  }
  return groups;
}
