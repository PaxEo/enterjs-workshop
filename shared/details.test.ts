import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OMMJsonObject } from 'satellite.js';
import { describe, expect, it } from 'vitest';
import { classifyOrbit, deriveOrbit } from './details.ts';

const iss = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', 'fixtures', 'iss-omm.json'), 'utf8'),
) as OMMJsonObject;

describe('deriveOrbit', () => {
  const orbit = deriveOrbit(iss);

  it('berechnet die Umlaufzeit der ISS (~93 min)', () => {
    expect(orbit.periodMin).toBeGreaterThan(92);
    expect(orbit.periodMin).toBeLessThan(94);
  });

  it('berechnet Perigäum und Apogäum der ISS', () => {
    expect(orbit.perigeeKm).toBeGreaterThan(400);
    expect(orbit.apogeeKm).toBeLessThan(440);
    expect(orbit.perigeeKm).toBeLessThanOrEqual(orbit.apogeeKm);
  });

  it('liest das Startjahr aus der COSPAR-ID', () => {
    expect(orbit.launchYear).toBe(1998);
  });

  it('erkennt einen LEO', () => {
    expect(orbit.orbitType).toBe('LEO');
  });
});

describe('classifyOrbit', () => {
  it.each([
    [500, 520, 0.001, 'LEO'],
    [20_100, 20_250, 0.005, 'MEO'],
    [35_780, 35_795, 0.0002, 'GEO'],
    [500, 39_000, 0.74, 'HEO'],
  ] as const)('Perigäum %d km, Apogäum %d km → %s', (perigee, apogee, ecc, expected) => {
    expect(classifyOrbit(perigee, apogee, ecc)).toBe(expected);
  });
});
