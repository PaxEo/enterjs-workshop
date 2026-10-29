import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Body, Equator, Horizon, Observer as AstroObserver } from 'astronomy-engine';
import type { OMMJsonObject } from 'satellite.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { type Satellite, elevationDeg, toSatellite } from './orbit.ts';
import { isSunlit, predictPasses, sunElevationDeg } from './passes.ts';

const fixture = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', name), 'utf8'));

const reference = fixture('reference-passes.json') as {
  observer: { lat: number; lon: number; heightM: number };
  passes: { visibleStart: string; visibleEnd: string }[];
};
const COLOGNE = reference.observer;

let iss: Satellite;
let epoch: Date;

beforeAll(() => {
  const omm = fixture('iss-omm.json') as OMMJsonObject;
  iss = toSatellite(omm)!;
  epoch = new Date(`${omm.EPOCH}Z`);
});

describe('Überflüge gegen Heavens-Above', () => {
  const diffS = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;

  it('findet jeden sichtbaren Überflug mit ±30 s Genauigkeit', () => {
    const from = new Date(reference.passes[0].visibleStart);
    from.setUTCHours(0, 0, 0, 0);
    const visible = predictPasses(iss, COLOGNE, from, { days: 10, stepSeconds: 5 }).filter((p) => p.visible);

    expect(visible).toHaveLength(reference.passes.length);
    reference.passes.forEach((ref, i) => {
      expect(diffS(visible[i].visible!.start, ref.visibleStart)).toBeLessThanOrEqual(30);
      expect(diffS(visible[i].visible!.end, ref.visibleEnd)).toBeLessThanOrEqual(30);
    });
  });
});

describe('Sonnenstand', () => {
  it('stimmt mit astronomy-engine auf 0,5° überein', () => {
    const obs = new AstroObserver(COLOGNE.lat, COLOGNE.lon, COLOGNE.heightM);
    for (let h = 0; h < 24; h += 3) {
      const date = new Date(epoch.getTime() + h * 3_600_000);
      const eq = Equator(Body.Sun, date, obs, true, true);
      const ref = Horizon(date, obs, eq.ra, eq.dec).altitude;
      expect(Math.abs(sunElevationDeg(COLOGNE, date) - ref)).toBeLessThan(0.5);
    }
  });
});

describe('predictPasses', () => {
  it('liefert konsistente Überflüge', () => {
    const passes = predictPasses(iss, COLOGNE, epoch, { days: 3 });
    expect(passes.length).toBeGreaterThan(5);
    for (const p of passes) {
      expect(p.start <= p.max && p.max <= p.end).toBe(true);
      expect(p.maxElevationDeg).toBeGreaterThanOrEqual(10);
      expect(p.maxElevationDeg).toBeLessThanOrEqual(90);
      expect(elevationDeg(iss, COLOGNE, new Date(p.max))).toBeCloseTo(p.maxElevationDeg, 0);
    }
  });

  it('meldet Sichtbarkeit nur bei Dunkelheit und beleuchtetem Satelliten', () => {
    const visible = predictPasses(iss, COLOGNE, epoch, { days: 10 }).filter((p) => p.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const p of visible) {
      const t = new Date(p.visible!.start);
      expect(sunElevationDeg(COLOGNE, t)).toBeLessThanOrEqual(-6);
      expect(isSunlit(iss, t)).toBe(true);
      expect(p.visible!.start >= p.start && p.visible!.end <= p.end).toBe(true);
    }
  });

  it('respektiert die Mindest-Elevation', () => {
    const passes = predictPasses(iss, COLOGNE, epoch, { days: 3, minElevationDeg: 40 });
    expect(passes.every((p) => p.maxElevationDeg >= 40)).toBe(true);
  });
});
