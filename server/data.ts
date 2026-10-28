// Lädt den CelesTrak-Snapshot aus data/ und hält ihn im Speicher.
// Live-Abrufe bei CelesTrak gibt es bewusst nicht: CelesTrak aktualisiert höchstens alle
// 2 Stunden und sperrt IPs, die öfter abfragen. Neue Daten: `npm run fetch-data -- --force`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OMMJsonObject } from 'satellite.js';
import { GROUPS, type GroupId } from '../shared/groups.ts';

const DATA_DIR = join(import.meta.dirname, '..', 'data');

const groupCache = new Map<GroupId, OMMJsonObject[]>();

export function loadGroup(id: GroupId): OMMJsonObject[] {
  let data = groupCache.get(id);
  if (!data) {
    data = JSON.parse(readFileSync(join(DATA_DIR, `${id}.json`), 'utf8')) as OMMJsonObject[];
    groupCache.set(id, data);
  }
  return data;
}

interface IndexEntry {
  omm: OMMJsonObject;
  groups: GroupId[];
}

let index: Map<number, IndexEntry> | null = null;

/** Alle bekannten Satelliten nach NORAD-ID, mit den Gruppen, in denen sie vorkommen */
export function satelliteIndex(): Map<number, IndexEntry> {
  if (!index) {
    index = new Map();
    for (const { id } of GROUPS) {
      for (const omm of loadGroup(id)) {
        const noradId = Number(omm.NORAD_CAT_ID);
        const entry = index.get(noradId);
        if (entry) entry.groups.push(id);
        else index.set(noradId, { omm, groups: [id] });
      }
    }
  }
  return index;
}

let notes: Record<string, string> | null = null;

export function noteFor(noradId: number): string | null {
  notes ??= JSON.parse(readFileSync(join(DATA_DIR, 'notes.json'), 'utf8')) as Record<string, string>;
  return notes[String(noradId)] ?? null;
}
