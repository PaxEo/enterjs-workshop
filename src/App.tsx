import { useMemo, useState } from 'react';
import { ClockContext, SimClock } from './clock.ts';
import { DEFAULT_OBSERVER } from './config.ts';
import { DetailsDrawer } from './details/DetailsDrawer.tsx';
import { type FrameStats, GlobeView, MAX_TRACKS } from './globe/GlobeView.tsx';
import { GroupFilter } from './groups/GroupFilter.tsx';
import { useGroupSelection } from './groups/useGroupSelection.ts';
import { PassList } from './passes/PassList.tsx';
import { SatelliteList } from './satellites/SatelliteList.tsx';
import { TimeControls } from './TimeControls.tsx';
import { useSatellites } from './useSatellites.ts';

export function App() {
  const clock = useMemo(() => new SimClock(), []);
  const [groups, setGroups] = useGroupSelection();
  const { satellites, loadingGroups, error } = useSatellites(groups);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<FrameStats | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lon: number } | null>(null);

  // Ohne Auswahl hebt der Globus die ISS hervor und zeigt ihre Bahn
  const showPass = () => {
    setSelectedId(null);
    if (!groups.includes('stations')) setGroups([...groups, 'stations']);
    setFocus({ lat: DEFAULT_OBSERVER.lat, lon: DEFAULT_OBSERVER.lon });
  };

  return (
    <ClockContext.Provider value={clock}>
      <div className="layout">
        <main className="stage">
          <GlobeView
            satellites={satellites}
            selectedId={selectedId}
            observer={DEFAULT_OBSERVER}
            focus={focus}
            showAllTracks={showAllTracks}
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
          <PassList observer={DEFAULT_OBSERVER} onJump={showPass} />
          <GroupFilter selected={groups} loading={loadingGroups} onChange={setGroups} />
          <label className="row">
            <input type="checkbox" checked={showAllTracks} onChange={(e) => setShowAllTracks(e.target.checked)} />
            <span>Bahnen aller Satelliten</span>
            <span className="muted">
              {satellites.length > MAX_TRACKS ? `nur bis ${MAX_TRACKS} Satelliten` : `${satellites.length}`}
            </span>
          </label>
          {error && <p className="warn">Fehler beim Laden: {error}</p>}
          {groups.length === 0 ? (
            <p className="muted">Keine Gruppe ausgewählt</p>
          ) : (
            <SatelliteList satellites={satellites} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </aside>
      </div>
    </ClockContext.Provider>
  );
}
