import { elevationDeg } from '../../../shared/orbit.ts';
import { useSimTime } from '../../clock.ts';
import { DEFAULT_OBSERVER } from '../../config.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails, useSatelliteRecord } from '../useSatelliteDetails.ts';

export function VisibilityPanel({ noradId }: { noradId: number }) {
  const satellite = useSatelliteRecord(noradId);
  const now = useSimTime();
  const elevation = satellite && elevationDeg(satellite, DEFAULT_OBSERVER, now);

  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {() => (
        <>
          <h3>Von {DEFAULT_OBSERVER.label} aus</h3>
          {elevation !== null && elevation !== undefined ? (
            <>
              <p className="big">{elevation > 0 ? 'Über dem Horizont' : 'Unter dem Horizont'}</p>
              <p className="muted">Elevation {elevation.toFixed(1)}°</p>
            </>
          ) : (
            <p className="muted">Nicht berechenbar</p>
          )}
        </>
      )}
    </PanelState>
  );
}
