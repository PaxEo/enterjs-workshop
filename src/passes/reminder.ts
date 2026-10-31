import type { Pass } from '../../shared/passes.ts';

export const REMINDER_LEAD_MS = 10 * 60_000;

/**
 * Sichtbarer Überflug, an den jetzt erinnert werden soll: Er beginnt in höchstens `leadMs`
 * und wurde noch nicht gemeldet. Gemeldet wird pro Überflug nur einmal.
 */
export function dueReminder(
  passes: Pass[],
  now: Date,
  alreadyNotified: ReadonlySet<string>,
  leadMs = REMINDER_LEAD_MS,
): Pass | null {
  const t = now.getTime();
  return (
    passes.find((p) => {
      if (!p.visible || alreadyNotified.has(p.start)) return false;
      const start = new Date(p.visible.start).getTime();
      return t >= start - leadMs && t < start;
    }) ?? null
  );
}
