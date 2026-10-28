import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';
import { speedKmS, toSatellite } from '../../../shared/orbit.ts';

export function VelocityPanel({ noradId }: { noradId: number }) {
  const [details, setDetails] = useState<SatelliteDetails | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json())
      .then(setDetails);
  }, [noradId]);

  useEffect(() => {
    if (!details) return;
    const sat = toSatellite(details.omm);
    if (!sat) return;
    const update = () => setSpeed(speedKmS(sat, new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [details]);

  if (speed === null) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Geschwindigkeit</h3>
      <p className="big">{speed.toFixed(2)} km/s</p>
      <p className="muted">{Math.round(speed * 3600).toLocaleString('de-DE')} km/h</p>
    </div>
  );
}
