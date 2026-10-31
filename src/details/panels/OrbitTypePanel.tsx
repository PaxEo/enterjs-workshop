import type { OrbitType } from '../../../shared/details.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

const EXPLANATION: Record<OrbitType, string> = {
  LEO: 'Niedrige Erdumlaufbahn: schnell, nah, oft mit bloßem Auge sichtbar.',
  MEO: 'Mittlere Umlaufbahn, typisch für Navigationssatelliten wie GPS.',
  GEO: 'Geostationär: steht scheinbar still über einem Punkt am Äquator.',
  HEO: 'Stark elliptische Bahn, verweilt lange über hohen Breiten.',
  andere: 'Bahn passt in keine der üblichen Kategorien.',
};

export function OrbitTypePanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => (
        <>
          <h3>Bahntyp</h3>
          <p className="big">{data.orbit.orbitType}</p>
          <p className="muted">{EXPLANATION[data.orbit.orbitType]}</p>
        </>
      )}
    </PanelState>
  );
}
