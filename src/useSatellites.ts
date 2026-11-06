import { useEffect, useMemo, useRef, useState } from 'react';
import type { GroupId } from '../shared/groups.ts';
import { type Satellite, toSatellite } from '../shared/orbit.ts';
import { fetchGroup } from './api.ts';
import { unionSatellites } from './groupFilter.ts';

export type GroupStatus = 'loading' | 'loaded' | 'error';

/**
 * Lädt die Bahndaten der angegebenen Gruppen (jede Gruppe nur einmal, danach gecacht)
 * und liefert ihre Vereinigung ohne Duplikate. Eine fehlgeschlagene Gruppe wird bei erneuter Aktivierung neu geladen.
 */
export function useSatellites(groups: GroupId[]) {
  const [loaded, setLoaded] = useState<Partial<Record<GroupId, Satellite[]>>>({});
  const [errors, setErrors] = useState<Partial<Record<GroupId, string>>>({});
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
          setErrors((e) => ({ ...e, [id]: err.message }));
        });
    }
  }, [groups]);

  /** Beim Abwählen aufrufen: eine fehlgeschlagene Gruppe wird bei erneuter Aktivierung neu geladen */
  const release = (id: GroupId) => {
    if (errors[id] === undefined) return;
    requested.current.delete(id);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => key !== id)));
  };

  const satellites = useMemo(() => unionSatellites(groups, loaded), [groups, loaded]);

  const status = (id: GroupId): GroupStatus | undefined =>
    loaded[id] ? 'loaded' : errors[id] !== undefined ? 'error' : groups.includes(id) ? 'loading' : undefined;

  const loading = groups.some((id) => status(id) === 'loading');
  const error = groups.map((id) => errors[id]).find((e) => e !== undefined) ?? null;

  return { satellites, loaded, status, loading, error, release };
}
