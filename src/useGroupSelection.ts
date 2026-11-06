import { useEffect, useState } from 'react';
import type { GroupInfo } from '../shared/api-types.ts';
import type { GroupId } from '../shared/groups.ts';
import { fetchGroups } from './api.ts';
import { normalizeGroups, parseGroupsParam, serializeGroupsParam } from './groupFilter.ts';

/** Gruppenauswahl mit Zustand im URL-Parameter `groups` (ohne neuen History-Eintrag) */
export function useGroupSelection(defaults: readonly GroupId[]) {
  const [groups, setGroups] = useState<GroupId[]>(() => parseGroupsParam(window.location.search, defaults));

  useEffect(() => {
    const search = serializeGroupsParam(window.location.search, groups);
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${search}${window.location.hash}`);
    }
  }, [groups]);

  /** Schaltet eine Gruppe um und liefert die neue Auswahl */
  const toggle = (id: GroupId): GroupId[] => {
    const next = normalizeGroups(groups.includes(id) ? groups.filter((g) => g !== id) : [...groups, id]);
    setGroups(next);
    return next;
  };

  return { groups, toggle };
}

/** Anzahl Satelliten je Gruppe aus /api/groups */
export function useGroupCounts() {
  const [counts, setCounts] = useState<Partial<Record<GroupId, number>>>({});
  useEffect(() => {
    fetchGroups()
      .then((infos: GroupInfo[]) => setCounts(Object.fromEntries(infos.map((g) => [g.id, g.count]))))
      .catch(() => setCounts({}));
  }, []);
  return counts;
}
