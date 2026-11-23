export type CartLine = {
  productId: string;
  qty: number;
  size?: string;
};

type PersistedCartLine = CartLine & { color?: string };

export function migrateCartLines(lines: PersistedCartLine[]): CartLine[] {
  const migrated = new Map<string, CartLine>();

  for (const { productId, qty, size } of lines) {
    const key = JSON.stringify([productId, size ?? null]);
    const existing = migrated.get(key);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 99);
    } else {
      migrated.set(key, { productId, qty, size });
    }
  }

  return [...migrated.values()];
}
