import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';

export function IdentityPanel({ noradId }: { noradId: number }) {
  const [data, setData] = useState<SatelliteDetails | null>(null);

  useEffect(() => {
    fetch(`/api/satellites/${noradId}`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [noradId]);

  if (!data) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Kennung</h3>
      <dl>
        <dt>Name</dt>
        <dd>{data.name}</dd>
        <dt>NORAD-ID</dt>
        <dd>{data.noradId}</dd>
        <dt>COSPAR-ID</dt>
        <dd>{data.cosparId}</dd>
        <dt>Gruppen</dt>
        <dd>{data.groups.join(', ')}</dd>
      </dl>
    </div>
  );
}
