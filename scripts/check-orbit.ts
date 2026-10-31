// Plausibilitäts- und Referenzprüfung der Bahnlogik. Aufruf: npx tsx scripts/check-orbit.ts
// Wird vom Subagenten orbit-checker genutzt, funktioniert aber auch von Hand.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OMMJsonObject } from 'satellite.js';
import { elevationDeg, speedKmS, subPointAt, toSatellite } from '../shared/orbit.ts';
import { predictPasses } from '../shared/passes.ts';

const fixture = (name: string) => JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', name), 'utf8'));
const omm = fixture('iss-omm.json') as OMMJsonObject;
const reference = fixture('reference-passes.json') as {
  observer: { lat: number; lon: number; heightM: number };
  passes: { visibleStart: string; visibleEnd: string }[];
};
const iss = toSatellite(omm)!;
const epoch = new Date(`${omm.EPOCH}Z`);
const inclination = Number(omm.INCLINATION);

let failures = 0;
const report = (name: string, problems: string[]) => {
  if (problems.length === 0) {
    console.log(`✓ ${name}`);
    return;
  }
  failures++;
  console.log(`✗ ${name}`);
  for (const p of problems.slice(0, 5)) console.log(`    ${p}`);
  if (problems.length > 5) console.log(`    … ${problems.length - 5} weitere`);
};

// 1. Harte Grenzen über 24 h
const bounds: string[] = [];
let maxEl = -90;
for (let m = 0; m < 24 * 60; m++) {
  const t = new Date(epoch.getTime() + m * 60_000);
  const p = subPointAt(iss, t);
  const el = elevationDeg(iss, reference.observer, t);
  const v = speedKmS(iss, t);
  if (!p || el === null || v === null) {
    bounds.push(`${t.toISOString()}: Propagation fehlgeschlagen`);
    continue;
  }
  maxEl = Math.max(maxEl, el);
  if (el < -90 || el > 90) bounds.push(`${t.toISOString()}: Elevation ${el.toFixed(2)}° außerhalb −90…90°`);
  if (p.altKm < 370 || p.altKm > 440) bounds.push(`${t.toISOString()}: Höhe ${p.altKm.toFixed(1)} km außerhalb 370–440 km`);
  if (Math.abs(p.lat) > inclination + 0.5) bounds.push(`${t.toISOString()}: Breite ${p.lat.toFixed(2)}° > Bahnneigung`);
  if (v < 7.6 || v > 7.7) bounds.push(`${t.toISOString()}: Geschwindigkeit ${v.toFixed(3)} km/s außerhalb 7,6–7,7`);
}
// −90…90° allein schließt nichts aus, auch Radiant liegen darin. Die ISS steigt über Köln täglich über 10°.
if (maxEl < 10) bounds.push(`höchste Elevation in 24 h nur ${maxEl.toFixed(2)}°, erwartet über 10° (Grad und Radiant verwechselt?)`);
report('Harte Grenzen (24 h, 1-min-Schritte)', bounds);

// 2. Sichtbare Überflüge gegen Heavens-Above
const refProblems: string[] = [];
const from = new Date(reference.passes[0].visibleStart);
from.setUTCHours(0, 0, 0, 0);
const visible = predictPasses(iss, reference.observer, from, { days: 10, stepSeconds: 5 }).filter((p) => p.visible);
if (visible.length !== reference.passes.length) {
  refProblems.push(`erwartet ${reference.passes.length} sichtbare Überflüge, gefunden ${visible.length}`);
}
reference.passes.forEach((ref, i) => {
  const ours = visible[i]?.visible;
  if (!ours) return;
  const dStart = Math.abs(new Date(ours.start).getTime() - new Date(ref.visibleStart).getTime()) / 1000;
  const dEnd = Math.abs(new Date(ours.end).getTime() - new Date(ref.visibleEnd).getTime()) / 1000;
  if (dStart > 30 || dEnd > 30) {
    refProblems.push(`${ref.visibleStart}: Beginn ${dStart.toFixed(0)} s, Ende ${dEnd.toFixed(0)} s Abweichung`);
  }
});
report(`Sichtbare Überflüge gegen Heavens-Above (${reference.passes.length} Stück, ±30 s)`, refProblems);

console.log(failures ? `\n${failures} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(failures ? 1 : 0);
