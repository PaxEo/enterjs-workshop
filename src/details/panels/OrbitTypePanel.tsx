import { useEffect, useState } from 'react';
import type { SatelliteDetails } from '../../../shared/api-types.ts';
import type { OrbitType } from '../../../shared/details.ts';

const EXPLANATION: Record<OrbitType, string> = {
  LEO: 'Niedrige Erdumlaufbahn: schnell, nah, oft mit bloßem Auge sichtbar.',
  MEO: 'Mittlere Umlaufbahn, typisch für Navigationssatelliten wie GPS.',
  GEO: 'Geostationär: steht scheinbar still über einem Punkt am Äquator.',
  HEO: 'Stark elliptische Bahn, verweilt lange über hohen Breiten.',
  andere: 'Bahn passt in keine der üblichen Kategorien.',
};

export function OrbitTypePanel({ noradId }: { noradId: number }) {
  const [data, setData] = useState<SatelliteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`/api/satellites/${noradId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Laden fehlgeschlagen');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [noradId]);

  if (error) return <div className="panel-card error">{error}</div>;
  if (!data) return <div className="panel-card">Lädt …</div>;

  return (
    <div className="panel-card">
      <h3>Bahntyp</h3>
      <p className="big">{data.orbit.orbitType}</p>
      <p className="muted">{EXPLANATION[data.orbit.orbitType]}</p>
    </div>
  );
}
