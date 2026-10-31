import { subPointAt } from '../../../shared/orbit.ts';
import { useSimTime } from '../../clock.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails, useSatelliteRecord } from '../useSatelliteDetails.ts';

export function PositionPanel({ noradId }: { noradId: number }) {
  const satellite = useSatelliteRecord(noradId);
  const now = useSimTime();
  const p = satellite && subPointAt(satellite, now);

  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {() => (
        <>
          <h3>Position</h3>
          {p ? (
            <dl>
              <dt>Breite</dt>
              <dd>{p.lat.toFixed(2)}°</dd>
              <dt>Länge</dt>
              <dd>{p.lon.toFixed(2)}°</dd>
              <dt>Höhe</dt>
              <dd>{Math.round(p.altKm)} km</dd>
            </dl>
          ) : (
            <p className="muted">Position nicht berechenbar</p>
          )}
        </>
      )}
    </PanelState>
  );
}
