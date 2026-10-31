import { PanelState } from '../PanelState.tsx';
import { useSatelliteDetails } from '../useSatelliteDetails.ts';

export function IdentityPanel({ noradId }: { noradId: number }) {
  return (
    <PanelState query={useSatelliteDetails(noradId)}>
      {(data) => (
        <>
          <h3>Kennung</h3>
          <dl>
            <dt>Name</dt>
            <dd>{data.name}</dd>
            <dt>NORAD-ID</dt>
            <dd>{data.noradId}</dd>
            <dt>COSPAR-ID</dt>
            <dd>{data.cosparId}</dd>
            <dt>Gruppen</dt>
            <dd>{data.groups.join(', ')}</dd>
          </dl>
        </>
      )}
    </PanelState>
  );
}
