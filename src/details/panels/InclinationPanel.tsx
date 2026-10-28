import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

export function InclinationPanel({ noradId }: { noradId: number }) {
  const [data, setData] = useState<SatelliteDetails | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/satellites/${noradId}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as SatelliteDetails;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noradId]);

  if (error) return <div className="panel-card error">Bahnneigung nicht verfügbar</div>;
  if (!data) return <div className="panel-card">Lädt …</div>;

  const inc = data.orbit.inclinationDeg;
  const maxLat = inc > 90 ? 180 - inc : inc;

  return (
    <div className="panel-card">
      <h3>Bahnneigung</h3>
      <p className="big">{inc.toFixed(1)}°</p>
      <p className="muted">
        Überfliegt Breiten bis ±{maxLat.toFixed(0)}°{inc > 90 && ' (rückläufige Bahn)'}
      </p>
    </div>
  );
}
