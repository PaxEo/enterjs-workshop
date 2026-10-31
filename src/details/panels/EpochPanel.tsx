import { useSimTime } from '../../clock.ts';
import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

const MAX_AGE_DAYS = 7;

export function EpochPanel({ noradId }: { noradId: number }) {
  const now = useSimTime(60_000);
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => {
        const epoch = new Date(data.orbit.epoch);
        const ageDays = (now.getTime() - epoch.getTime()) / 86_400_000;
        const stale = ageDays > MAX_AGE_DAYS;
        return (
          <>
            <h3>Bahndaten</h3>
            <dl>
              <dt>Epoche</dt>
              <dd>{epoch.toLocaleString('de-DE')}</dd>
              <dt>Alter</dt>
              <dd className={stale ? 'warn' : ''}>{ageDays.toFixed(1)} Tage</dd>
            </dl>
            {stale && <p className="warn">Bahndaten sind veraltet, Positionen werden ungenau.</p>}
          </>
        );
      }}
    </PanelState>
  );
}
