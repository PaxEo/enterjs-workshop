import { AltitudePanel } from './panels/AltitudePanel.tsx';
import { EccentricityPanel } from './panels/EccentricityPanel.tsx';
import { EpochPanel } from './panels/EpochPanel.tsx';
import { IdentityPanel } from './panels/IdentityPanel.tsx';
import { InclinationPanel } from './panels/InclinationPanel.tsx';
import { LaunchPanel } from './panels/LaunchPanel.tsx';
import { NotePanel } from './panels/NotePanel.tsx';
import { OrbitTypePanel } from './panels/OrbitTypePanel.tsx';
import { PeriodPanel } from './panels/PeriodPanel.tsx';
import { PositionPanel } from './panels/PositionPanel.tsx';
import { VelocityPanel } from './panels/VelocityPanel.tsx';
import { VisibilityPanel } from './panels/VisibilityPanel.tsx';

interface Props {
  noradId: number;
  onClose: () => void;
}

export function DetailsDrawer({ noradId, onClose }: Props) {
  return (
    <div className="drawer" role="dialog" aria-label="Satellitendetails">
      <button className="close" onClick={onClose} aria-label="Details schließen">
        ×
      </button>
      <div className="panel-grid">
        <IdentityPanel noradId={noradId} />
        <VisibilityPanel noradId={noradId} />
        <PositionPanel noradId={noradId} />
        <VelocityPanel noradId={noradId} />
        <OrbitTypePanel noradId={noradId} />
        <AltitudePanel noradId={noradId} />
        <PeriodPanel noradId={noradId} />
        <InclinationPanel noradId={noradId} />
        <EccentricityPanel noradId={noradId} />
        <LaunchPanel noradId={noradId} />
        <EpochPanel noradId={noradId} />
        <NotePanel noradId={noradId} />
      </div>
    </div>
  );
}
