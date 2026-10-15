/** One keeper attempt per bot per interval bucket. Callers pass the store so tests stay pure. */
export function tickIdempotencyKey(botId: string, intervalSec: number, nowMs: number): string {
  const interval = Number.isFinite(intervalSec) ? Math.max(1, Math.floor(intervalSec)) : 1;
  const bucket = Math.floor(nowMs / 1000 / interval);
  return `${botId}:${bucket}`;
}

export function claimIdempotency(store: Map<string, number>, key: string, nowMs: number): "new" | "duplicate" {
  const cutoff = nowMs - 48 * 60 * 60 * 1000;
  for (const [seen, at] of store) {
    if (at < cutoff) store.delete(seen);
  }
  if (store.has(key)) return "duplicate";
  store.set(key, nowMs);
  return "new";
}
