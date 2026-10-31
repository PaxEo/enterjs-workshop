import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function InclinationPanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => {
        const inc = data.orbit.inclinationDeg;
        const maxLat = inc > 90 ? 180 - inc : inc;
        return (
          <>
            <h3>Bahnneigung</h3>
            <p className="big">{inc.toFixed(1)}°</p>
            <p className="muted">
              Überfliegt Breiten bis ±{maxLat.toFixed(0)}°{inc > 90 && ' (rückläufige Bahn)'}
            </p>
          </>
        );
      }}
    </PanelState>
  );
}
