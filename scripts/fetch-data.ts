// Lädt einen Snapshot der Bahndaten von CelesTrak nach data/<gruppe>.json.
// CelesTrak aktualisiert höchstens alle 2 Stunden und sperrt IPs, die öfter abfragen.
// Deshalb: vorhandene Dateien werden nur mit --force neu geladen.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUPS } from '../shared/groups.ts';

const DATA_DIR = join(import.meta.dirname, '..', 'data');
const force = process.argv.includes('--force');

mkdirSync(DATA_DIR, { recursive: true });

for (const { id } of GROUPS) {
  const file = join(DATA_DIR, `${id}.json`);
  if (existsSync(file) && !force) {
    const ageH = (Date.now() - statSync(file).mtimeMs) / 3_600_000;
    console.log(`${id}: vorhanden (${ageH.toFixed(1)} h alt), übersprungen`);
    continue;
  }
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${id}&FORMAT=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const data = (await res.json()) as unknown[];
  writeFileSync(file, JSON.stringify(data));
  console.log(`${id}: ${data.length} Objekte`);
}
