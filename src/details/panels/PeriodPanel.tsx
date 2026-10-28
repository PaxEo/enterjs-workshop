import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

export function PeriodPanel({ noradId }: { noradId: number }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number | null>(null);
  const [revs, setRevs] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json() as Promise<SatelliteDetails>)
      .then((data) => {
        setPeriod(data.orbit.periodMin);
        setRevs(data.orbit.revsPerDay);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [noradId]);

  if (loading) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Umlauf</h3>
      <dl>
        <dt>Umlaufzeit</dt>
        <dd>{period !== null ? `${period.toFixed(1)} min` : '–'}</dd>
        <dt>Umläufe pro Tag</dt>
        <dd>{revs !== null ? revs.toFixed(2) : '–'}</dd>
      </dl>
    </div>
  );
}
