import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

const MAX_AGE_DAYS = 7;

export function EpochPanel({ noradId }: { noradId: number }) {
  const [epoch, setEpoch] = useState<string | null>(null);
  const [ageDays, setAgeDays] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/satellites/' + noradId)
      .then((r) => r.json())
      .then((d: SatelliteDetails) => {
        setEpoch(d.orbit.epoch);
        setAgeDays((Date.now() - new Date(d.orbit.epoch).getTime()) / 86_400_000);
        setLoading(false);
      });
  }, [noradId]);

  if (loading || !epoch) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Bahndaten</h3>
      <dl>
        <dt>Epoche</dt>
        <dd>{new Date(epoch).toLocaleString('de-DE')}</dd>
        <dt>Alter</dt>
        <dd className={ageDays > MAX_AGE_DAYS ? 'warn' : ''}>{ageDays.toFixed(1)} Tage</dd>
      </dl>
      {ageDays > MAX_AGE_DAYS && <p className="warn">Bahndaten sind veraltet, Positionen werden ungenau.</p>}
    </div>
  );
}
