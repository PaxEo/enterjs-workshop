import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

export function EccentricityPanel({ noradId }: { noradId: number }) {
  const [ecc, setEcc] = useState<number>();
  const [axis, setAxis] = useState<number>();

  useEffect(() => {
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json())
      .then((data: SatelliteDetails) => {
        setEcc(data.orbit.eccentricity);
        setAxis(data.orbit.semiMajorAxisKm);
      });
  }, [noradId]);

  if (ecc === undefined) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Bahnform</h3>
      <dl>
        <dt>Exzentrizität</dt>
        <dd>{ecc.toFixed(5)}</dd>
        <dt>Große Halbachse</dt>
        <dd>{axis ? `${Math.round(axis)} km` : '–'}</dd>
      </dl>
      <p className="muted">{ecc < 0.01 ? 'Nahezu kreisförmig' : 'Elliptisch'}</p>
    </div>
  );
}
