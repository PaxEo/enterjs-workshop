import { describe, expect, it } from 'vitest';
import type { Pass } from '../../shared/passes.ts';
import { formatCountdown, nextVisiblePass } from './format.ts';

describe('formatCountdown', () => {
  it.each([
    [0, 'jetzt'],
    [-5000, 'jetzt'],
    [30_000, 'in 1 min'],
    [4 * 60_000, 'in 4 min'],
    [(3 * 60 + 12) * 60_000, 'in 3 h 12 min'],
    [(26 * 60 + 5) * 60_000, 'in 1 d 2 h'],
  ])('%d ms → %s', (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected);
  });
});

describe('nextVisiblePass', () => {
  const pass = (start: string, end: string, visible: boolean): Pass => ({
    start,
    max: start,
    end,
    maxElevationDeg: 30,
    visible: visible ? { start, end } : null,
  });
  const passes = [
    pass('2026-10-19T04:30:00Z', '2026-10-19T04:36:00Z', true),
    pass('2026-10-19T06:06:00Z', '2026-10-19T06:12:00Z', false),
    pass('2026-10-20T03:45:00Z', '2026-10-20T03:48:00Z', true),
  ];

  it('überspringt nicht sichtbare und vergangene Überflüge', () => {
    expect(nextVisiblePass(passes, new Date('2026-10-19T05:00:00Z'))?.start).toBe('2026-10-20T03:45:00Z');
  });

  it('liefert einen laufenden sichtbaren Überflug', () => {
    expect(nextVisiblePass(passes, new Date('2026-10-19T04:33:00Z'))?.start).toBe('2026-10-19T04:30:00Z');
  });

  it('liefert null, wenn nichts mehr kommt', () => {
    expect(nextVisiblePass(passes, new Date('2026-10-21T00:00:00Z'))).toBeNull();
  });
});
