// Reine Logik für den Gruppenfilter (specs/group-filter.md): URL-Parameter, Vereinigung, Auswahl
import { GROUPS, type GroupId, isGroupId } from '../shared/groups.ts';
import type { Satellite } from '../shared/orbit.ts';

export const GROUPS_PARAM = 'groups';

/** Ab dieser Anzahl Satelliten gilt eine Gruppe als groß und löst einen Hinweis aus */
export const LARGE_GROUP_THRESHOLD = 1000;

/** Bringt Gruppen in die Reihenfolge von GROUPS und entfernt Duplikate */
export function normalizeGroups(ids: Iterable<GroupId>): GroupId[] {
  const set = new Set(ids);
  return GROUPS.map((g) => g.id).filter((id) => set.has(id));
}

/**
 * Liest die Gruppenauswahl aus einem Query-String.
 * Fehlt der Parameter, gilt `defaults`. Ein leerer Parameter oder nur unbekannte IDs ergeben eine leere Auswahl.
 */
export function parseGroupsParam(search: string, defaults: readonly GroupId[]): GroupId[] {
  const raw = new URLSearchParams(search).get(GROUPS_PARAM);
  if (raw === null) return normalizeGroups(defaults);
  return normalizeGroups(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(isGroupId),
  );
}

/** Schreibt die Auswahl in einen Query-String und lässt andere Parameter unverändert */
export function serializeGroupsParam(search: string, groups: readonly GroupId[]): string {
  const params = new URLSearchParams(search);
  params.delete(GROUPS_PARAM);
  // Kommas bewusst unkodiert, damit die URL lesbar bleibt (?groups=stations,weather)
  const parts = [params.toString(), `${GROUPS_PARAM}=${normalizeGroups(groups).join(',')}`].filter(Boolean);
  return `?${parts.join('&')}`;
}

/** Vereinigung der geladenen Satelliten der aktiven Gruppen, jeder Satellit genau einmal */
export function unionSatellites(
  groups: readonly GroupId[],
  loaded: Partial<Record<GroupId, Satellite[]>>,
): Satellite[] {
  const byId = new Map<number, Satellite>();
  for (const id of groups) for (const s of loaded[id] ?? []) byId.set(s.noradId, s);
  return [...byId.values()];
}

/** Ausgewählter Satellit nach einer Gruppenänderung: bleibt nur, wenn er noch in einer aktiven Gruppe liegt */
export function selectionAfterChange(
  selectedId: number | null,
  groups: readonly GroupId[],
  loaded: Partial<Record<GroupId, Satellite[]>>,
): number | null {
  if (selectedId === null) return null;
  const stillActive = groups.some((id) => loaded[id]?.some((s) => s.noradId === selectedId));
  return stillActive ? selectedId : null;
}

/** Ob mindestens eine aktive Gruppe als groß gilt */
export function hasLargeGroup(groups: readonly GroupId[], counts: Partial<Record<GroupId, number>>): boolean {
  return groups.some((id) => (counts[id] ?? 0) >= LARGE_GROUP_THRESHOLD);
}
