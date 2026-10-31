import { speedKmS } from '../../../shared/orbit.ts';
import { useSimTime } from '../../clock.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails, useSatelliteRecord } from '../useSatelliteDetails.ts';

export function VelocityPanel({ noradId }: { noradId: number }) {
  const satellite = useSatelliteRecord(noradId);
  const now = useSimTime();
  const speed = satellite && speedKmS(satellite, now);

  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {() => (
        <>
          <h3>Geschwindigkeit</h3>
          {speed ? (
            <>
              <p className="big">{speed.toFixed(2)} km/s</p>
              <p className="muted">{Math.round(speed * 3600).toLocaleString('de-DE')} km/h</p>
            </>
          ) : (
            <p className="muted">Nicht berechenbar</p>
          )}
        </>
      )}
    </PanelState>
  );
}
