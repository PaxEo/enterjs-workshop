import { type GroupId, isGroupId } from '../../shared/groups.ts';

/** Liest die Gruppenauswahl aus dem URL-Parameter `groups`; `null`, wenn der Parameter fehlt */
export function parseGroupsParam(search: string): GroupId[] | null {
  const value = new URLSearchParams(search).get('groups');
  if (value === null) return null;
  const ids = value
    .split(',')
    .map((s) => s.trim())
    .filter(isGroupId);
  return [...new Set(ids)];
}

/** Schreibt die Gruppenauswahl in einen Query-String, andere Parameter bleiben erhalten */
export function toGroupsParam(search: string, groups: GroupId[]): string {
  const params = new URLSearchParams(search);
  params.set('groups', groups.join(','));
  return `?${params.toString().replace(/%2C/g, ',')}`;
}
