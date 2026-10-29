import type { Pass } from '../../shared/passes.ts';

const time = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function formatPassTime(pass: Pass): string {
  const start = new Date(pass.start);
  const day = start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return `${day} ${time(start)}–${time(new Date(pass.end))}`;
}

/** „in 3 h 12 min“, „in 4 min“, „jetzt“ */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'jetzt';
  const totalMin = Math.ceil(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `in ${days} d ${hours} h`;
  if (hours > 0) return `in ${hours} h ${minutes} min`;
  return `in ${minutes} min`;
}

/** Nächster sichtbarer Überflug, der zum Zeitpunkt `now` noch nicht vorbei ist */
export function nextVisiblePass(passes: Pass[], now: Date): Pass | null {
  return passes.find((p) => p.visible && new Date(p.visible.end) > now) ?? null;
}
