import { useSimTime } from '../../clock.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function LaunchPanel({ noradId }: { noradId: number }) {
  const now = useSimTime(60_000);
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => {
        const year = data.orbit.launchYear;
        const yearsInOrbit = year ? now.getFullYear() - year : null;
        return (
          <>
            <h3>Start</h3>
            <dl>
              <dt>Startjahr</dt>
              <dd>{year ?? 'unbekannt'}</dd>
              <dt>Im Orbit seit</dt>
              <dd>{yearsInOrbit !== null ? `${yearsInOrbit} Jahren` : '–'}</dd>
            </dl>
          </>
        );
      }}
    </PanelState>
  );
}
