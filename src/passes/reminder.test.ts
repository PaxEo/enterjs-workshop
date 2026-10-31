import { describe, expect, it } from 'vitest';
import type { Pass } from '../../shared/passes.ts';
import { dueReminder } from './reminder.ts';

const pass = (visibleStart: string | null, start = visibleStart ?? '2026-10-19T06:00:00Z'): Pass => ({
  start,
  max: start,
  end: start,
  maxElevationDeg: 40,
  visible: visibleStart ? { start: visibleStart, end: visibleStart } : null,
});

const passes = [pass(null, '2026-10-19T03:00:00Z'), pass('2026-10-19T04:30:00Z'), pass('2026-10-20T03:45:00Z')];
const at = (iso: string) => new Date(iso);

describe('dueReminder', () => {
  it('erinnert 10 Minuten vor dem sichtbaren Beginn', () => {
    expect(dueReminder(passes, at('2026-10-19T04:20:00Z'), new Set())?.start).toBe('2026-10-19T04:30:00Z');
  });

  it('erinnert nicht zu früh', () => {
    expect(dueReminder(passes, at('2026-10-19T04:19:59Z'), new Set())).toBeNull();
  });

  it('erinnert nicht mehr, wenn der Überflug begonnen hat', () => {
    expect(dueReminder(passes, at('2026-10-19T04:30:00Z'), new Set())).toBeNull();
  });

  it('erinnert pro Überflug nur einmal', () => {
    expect(dueReminder(passes, at('2026-10-19T04:25:00Z'), new Set(['2026-10-19T04:30:00Z']))).toBeNull();
  });

  it('ignoriert nicht sichtbare Überflüge', () => {
    expect(dueReminder(passes, at('2026-10-19T02:55:00Z'), new Set())).toBeNull();
  });

  it('nutzt die angegebene Vorlaufzeit', () => {
    expect(dueReminder(passes, at('2026-10-19T04:00:00Z'), new Set(), 30 * 60_000)).not.toBeNull();
  });
});
