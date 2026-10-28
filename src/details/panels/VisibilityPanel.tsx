import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';
import { elevationDeg, toSatellite } from '../../../shared/orbit.ts';
import { DEFAULT_OBSERVER } from '../../config.ts';

export function VisibilityPanel({ noradId }: { noradId: number }) {
  const [elevation, setElevation] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json())
      .then((data: SatelliteDetails) => {
        const sat = toSatellite(data.omm);
        if (!sat) return;
        const update = () => setElevation(elevationDeg(sat, DEFAULT_OBSERVER, new Date()));
        update();
        timer = setInterval(update, 1000);
      });
    return () => clearInterval(timer);
  }, [noradId]);

  if (elevation === null) return <div className="panel-card">Lädt …</div>;

  const above = elevation > 0;

  return (
    <div className="panel-card">
      <h3>Von {DEFAULT_OBSERVER.label} aus</h3>
      <p className="big">{above ? 'Über dem Horizont' : 'Unter dem Horizont'}</p>
      <p className="muted">Elevation {elevation.toFixed(1)}°</p>
    </div>
  );
}
