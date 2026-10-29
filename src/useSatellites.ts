import { useEffect, useMemo, useRef, useState } from 'react';
import type { GroupId } from '../shared/groups.ts';
import { type Satellite, toSatellite } from '../shared/orbit.ts';
import { fetchGroup } from './api.ts';

/** Lädt die Bahndaten der angegebenen Gruppen (jede Gruppe nur einmal) und liefert sie ohne Duplikate */
export function useSatellites(groups: GroupId[]) {
  const [loaded, setLoaded] = useState<Partial<Record<GroupId, Satellite[]>>>({});
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(new Set<GroupId>());

  useEffect(() => {
    for (const id of groups) {
      if (requested.current.has(id)) continue;
      requested.current.add(id);
      fetchGroup(id)
        .then((omms) => {
          const sats = omms.map(toSatellite).filter((s) => s !== null);
          setLoaded((l) => ({ ...l, [id]: sats }));
        })
        .catch((err: Error) => {
          requested.current.delete(id);
          setError(err.message);
        });
    }
  }, [groups]);

  const satellites = useMemo(() => {
    const byId = new Map<number, Satellite>();
    for (const id of groups) for (const s of loaded[id] ?? []) byId.set(s.noradId, s);
    return [...byId.values()];
  }, [groups, loaded]);

  const loadingGroups = groups.filter((id) => !loaded[id]);

  return { satellites, loadingGroups, error };
}
