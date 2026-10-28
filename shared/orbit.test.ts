import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OMMJsonObject } from 'satellite.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Satellite, elevationDeg, speedKmS, splitAtDateLine, subPointAt, toSatellite } from './orbit.ts';

const fixture = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', name), 'utf8'));

// Eingefrorene ISS-Bahndaten vom 18.10.2026, passend zu fixtures/reference-passes.json
let iss: Satellite;
let epoch: Date;

beforeAll(() => {
  const omm = fixture('iss-omm.json') as OMMJsonObject;
  iss = toSatellite(omm)!;
  epoch = new Date(`${omm.EPOCH}Z`);
});

describe('ISS-Position', () => {
  it('fliegt in 370–440 km Höhe', () => {
    for (let h = 0; h < 24; h++) {
      const p = subPointAt(iss, new Date(epoch.getTime() + h * 3_600_000))!;
      expect(p.altKm).toBeGreaterThan(370);
      expect(p.altKm).toBeLessThan(440);
    }
  });

  it('kommt nie über die Bahnneigung von ~51,6° hinaus', () => {
    for (let m = 0; m < 24 * 60; m += 5) {
      const p = subPointAt(iss, new Date(epoch.getTime() + m * 60_000))!;
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(52);
    }
  });

  it('fliegt mit rund 7,66 km/s', () => {
    expect(speedKmS(iss, epoch)).toBeCloseTo(7.66, 1);
  });
});

describe('Elevation über dem Horizont', () => {
  // Referenzwerte: Heavens-Above, ISS über Köln (siehe fixtures/reference-passes.json)
  const reference = fixture('reference-passes.json') as {
    observer: { lat: number; lon: number; heightM: number };
    passes: { highest: string; highestElevationDeg: number }[];
  };

  it.each(reference.passes.slice(0, 5))('Höchststand am $highest: $highestElevationDeg°', (pass) => {
    const el = elevationDeg(iss, reference.observer, new Date(pass.highest))!;
    expect(el).toBeGreaterThanOrEqual(pass.highestElevationDeg - 1.5);
    expect(el).toBeLessThanOrEqual(pass.highestElevationDeg + 1.5);
  });

  it('liegt immer zwischen -90° und 90°', () => {
    for (let m = 0; m < 24 * 60; m += 7) {
      const el = elevationDeg(iss, reference.observer, new Date(epoch.getTime() + m * 60_000))!;
      expect(el).toBeGreaterThanOrEqual(-90);
      expect(el).toBeLessThanOrEqual(90);
    }
  });
});

describe('splitAtDateLine', () => {
  it('trennt eine Bahn an der Datumsgrenze', () => {
    const segments = splitAtDateLine([
      { lat: 0, lon: 170, altKm: 400 },
      { lat: 1, lon: 178, altKm: 400 },
      { lat: 2, lon: -175, altKm: 400 },
      { lat: 3, lon: -168, altKm: 400 },
    ]);
    expect(segments).toHaveLength(2);
  });
});
