export type PendingHostPartySummary = {
  roomId: string;
  durationSec: number;
};

let pending: PendingHostPartySummary | null = null;

/** Call immediately before `router.replace("/(tabs)/parties")` so the Parties screen can open the summary (tab routes may not receive navigation params reliably). */
export function stashHostPartySummaryIntent(data: PendingHostPartySummary): void {
  pending = data;
}

export function takeHostPartySummaryIntent(): PendingHostPartySummary | null {
  const next = pending;
  pending = null;
  return next;
}
