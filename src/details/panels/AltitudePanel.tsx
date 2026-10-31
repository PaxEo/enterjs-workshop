import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function AltitudePanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => (
        <>
          <h3>Bahnhöhe</h3>
          <dl>
            <dt>Perigäum</dt>
            <dd>{Math.round(data.orbit.perigeeKm)} km</dd>
            <dt>Apogäum</dt>
            <dd>{Math.round(data.orbit.apogeeKm)} km</dd>
          </dl>
        </>
      )}
    </PanelState>
  );
}
