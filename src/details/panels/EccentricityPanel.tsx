import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function EccentricityPanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => (
        <>
          <h3>Bahnform</h3>
          <dl>
            <dt>Exzentrizität</dt>
            <dd>{data.orbit.eccentricity.toFixed(5)}</dd>
            <dt>Große Halbachse</dt>
            <dd>{Math.round(data.orbit.semiMajorAxisKm)} km</dd>
          </dl>
          <p className="muted">{data.orbit.eccentricity < 0.01 ? 'Nahezu kreisförmig' : 'Elliptisch'}</p>
        </>
      )}
    </PanelState>
  );
}
