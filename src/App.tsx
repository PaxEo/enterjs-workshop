import { useMemo, useState } from 'react';
import { ClockContext, SimClock } from './clock.ts';
import { DEFAULT_GROUPS, DEFAULT_OBSERVER } from './config.ts';
import { DetailsDrawer } from './details/DetailsDrawer.tsx';
import { type FrameStats, GlobeView } from './globe/GlobeView.tsx';
import { SatelliteList } from './satellites/SatelliteList.tsx';
import { TimeControls } from './TimeControls.tsx';
import { useSatellites } from './useSatellites.ts';

export function App() {
  const clock = useMemo(() => new SimClock(), []);
  const { satellites, loading, error } = useSatellites(DEFAULT_GROUPS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<FrameStats | null>(null);

  return (
    <ClockContext.Provider value={clock}>
      <div className="layout">
        <main className="stage">
          <GlobeView
            satellites={satellites}
            selectedId={selectedId}
            observer={DEFAULT_OBSERVER}
            onSelect={setSelectedId}
            onStats={setStats}
          />
          {stats && (
            <div className="hud" aria-label="Messwerte">
              {stats.fps} FPS · {stats.rendered} Satelliten · {stats.propagationMs.toFixed(1)} ms
            </div>
          )}
          {selectedId !== null && <DetailsDrawer noradId={selectedId} onClose={() => setSelectedId(null)} />}
        </main>
        <aside className="sidebar">
          <h1>Was fliegt da über uns?</h1>
          <TimeControls />
          {error && <p className="warn">Fehler beim Laden: {error}</p>}
          {loading && <p className="muted">Lade Bahndaten …</p>}
          <SatelliteList satellites={satellites} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
      </div>
    </ClockContext.Provider>
  );
}
