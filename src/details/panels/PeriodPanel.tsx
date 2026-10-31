import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function PeriodPanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => (
        <>
          <h3>Umlauf</h3>
          <dl>
            <dt>Umlaufzeit</dt>
            <dd>{data.orbit.periodMin.toFixed(1)} min</dd>
            <dt>Umläufe pro Tag</dt>
            <dd>{data.orbit.revsPerDay.toFixed(2)}</dd>
          </dl>
        </>
      )}
    </PanelState>
  );
}
