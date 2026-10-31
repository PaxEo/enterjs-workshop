import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toSatellite } from '../../shared/orbit.ts';
import { fetchSatelliteDetails } from '../api.ts';

/**
 * Details zu einem Satelliten. Alle Panels teilen sich dieselbe Abfrage:
 * TanStack Query dedupliziert gleichzeitige Aufrufe und cacht das Ergebnis.
 */
export function useSatelliteDetails(noradId: number) {
  return useQuery({
    queryKey: ['satellite', noradId],
    queryFn: () => fetchSatelliteDetails(noradId),
    staleTime: Infinity, // Bahndaten ändern sich während einer Sitzung nicht
  });
}

/** Propagierbarer Satellit zu den Details, für Panels mit Live-Werten */
export function useSatelliteRecord(noradId: number) {
  const { data } = useSatelliteDetails(noradId);
  return useMemo(() => (data ? toSatellite(data.omm) : null), [data]);
}
