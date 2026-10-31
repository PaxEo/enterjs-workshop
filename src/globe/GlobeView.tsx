import Globe from 'globe.gl';
import { useEffect, useRef } from 'react';
import { ISS_NORAD_ID } from '../../shared/groups.ts';
import {
  type Observer,
  type Satellite,
  type SubPoint,
  orbitTrack,
  splitAtDateLine,
  subPointAt,
} from '../../shared/orbit.ts';
import { useClock } from '../clock.ts';

const EARTH_RADIUS_KM = 6371;
const UPDATE_INTERVAL_MS = 250;
const TRACK_REFRESH_SIM_MS = 30_000;

export interface FrameStats {
  fps: number;
  propagationMs: number;
  rendered: number;
}

interface Props {
  satellites: Satellite[];
  selectedId: number | null;
  observer: Observer;
  /** Neue Objektreferenz dreht den Globus zu diesem Punkt */
  focus?: { lat: number; lon: number } | null;
  /** Bahnlinien für alle Satelliten statt nur für den hervorgehobenen (bis MAX_TRACKS) */
  showAllTracks?: boolean;
  onSelect: (noradId: number) => void;
  onStats?: (stats: FrameStats) => void;
}

interface Particle {
  noradId: number;
  lat: number;
  lng: number;
  alt: number;
}

interface Track {
  points: SubPoint[];
  focus: boolean;
}

/** Mehr Bahnlinien werden unübersichtlich und kosten spürbar Rechenzeit */
export const MAX_TRACKS = 100;

export function GlobeView({
  satellites,
  selectedId,
  observer,
  focus,
  showAllTracks = false,
  onSelect,
  onStats,
}: Props) {
  const clock = useClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<InstanceType<typeof Globe> | null>(null);

  // Aktuelle Props für die Update-Schleife, ohne sie bei jeder Änderung neu zu starten
  const live = useRef({ satellites, selectedId, showAllTracks, onSelect, onStats });
  useEffect(() => {
    live.current = { satellites, selectedId, showAllTracks, onSelect, onStats };
  });

  useEffect(() => {
    const el = containerRef.current!;
    const highlight: Particle[] = [];

    const globe = new Globe(el)
      .globeImageUrl('/earth-blue-marble.jpg')
      .bumpImageUrl('/earth-topology.png')
      .backgroundImageUrl('/night-sky.png')
      .particleLat('lat')
      .particleLng('lng')
      .particleAltitude('alt')
      .particlesSizeAttenuation(false)
      .particlesSize((list: object) => (list === highlight ? 7 : 2.5))
      .particlesColor((list: object) => (list === highlight ? 'orangered' : 'palegreen'))
      .onParticleClick((p: object) => live.current.onSelect((p as Particle).noradId))
      .pathPoints('points')
      .pathPointLat('lat')
      .pathPointLng('lon')
      .pathPointAlt((p: SubPoint) => p.altKm / EARTH_RADIUS_KM)
      .pathColor((t: object) => ((t as Track).focus ? 'rgba(255, 140, 90, 0.9)' : 'rgba(152, 251, 152, 0.3)'))
      .pathStroke((t: object) => ((t as Track).focus ? 1.5 : 0.6))
      .pathTransitionDuration(0)
      .labelLat('lat')
      .labelLng('lng')
      .labelText('text')
      .labelSize(1.2)
      .labelDotRadius(0.5)
      .labelColor(() => 'gold');
    globe.pointOfView({ lat: 30, lng: 10, altitude: 3 });
    globeRef.current = globe;

    const resize = new ResizeObserver(() => globe.width(el.clientWidth).height(el.clientHeight));
    resize.observe(el);

    let frames = 0;
    let raf = 0;
    const countFrame = () => {
      frames++;
      raf = requestAnimationFrame(countFrame);
    };
    raf = requestAnimationFrame(countFrame);

    let trackKey = '';
    let trackAt = 0;
    let propSum = 0;
    let updates = 0;
    let rendered = 0;

    const update = () => {
      const { satellites: sats, selectedId: selected, showAllTracks: allTracks } = live.current;
      const focusId = selected ?? ISS_NORAD_ID;
      const now = clock.now();

      const t0 = performance.now();
      const others: Particle[] = [];
      highlight.length = 0;
      let focusSat: Satellite | undefined;
      for (const s of sats) {
        const p = subPointAt(s, now);
        if (!p) continue;
        const particle = { noradId: s.noradId, lat: p.lat, lng: p.lon, alt: p.altKm / EARTH_RADIUS_KM };
        if (s.noradId === focusId) {
          highlight.push(particle);
          focusSat = s;
        } else {
          others.push(particle);
        }
      }
      propSum += performance.now() - t0;
      updates++;
      rendered = others.length + highlight.length;

      globe.particlesData([others, highlight]);

      // Bahnlinien nur neu berechnen, wenn sich die Auswahl ändert oder die Simulationszeit weiterläuft
      const withTracks = allTracks && sats.length <= MAX_TRACKS ? sats : focusSat ? [focusSat] : [];
      const key = `${focusId}:${withTracks.length}:${allTracks}`;
      if (key !== trackKey || Math.abs(now.getTime() - trackAt) > TRACK_REFRESH_SIM_MS) {
        const tracks: Track[] = withTracks.flatMap((s) =>
          splitAtDateLine(orbitTrack(s, now)).map((points) => ({ points, focus: s.noradId === focusId })),
        );
        // Hervorgehobene Bahn zuletzt zeichnen, damit sie oben liegt
        globe.pathsData(tracks.sort((a, b) => Number(a.focus) - Number(b.focus)));
        trackKey = key;
        trackAt = now.getTime();
      }
    };
    const updateTimer = setInterval(update, UPDATE_INTERVAL_MS);
    update();

    const statsTimer = setInterval(() => {
      live.current.onStats?.({ fps: frames, propagationMs: updates ? propSum / updates : 0, rendered });
      frames = propSum = updates = 0;
    }, 1000);

    return () => {
      clearInterval(updateTimer);
      clearInterval(statsTimer);
      cancelAnimationFrame(raf);
      resize.disconnect();
      globe._destructor();
      el.innerHTML = '';
      globeRef.current = null;
    };
  }, [clock]);

  useEffect(() => {
    globeRef.current?.labelsData([{ lat: observer.lat, lng: observer.lon, text: 'Du' }]);
  }, [observer.lat, observer.lon]);

  useEffect(() => {
    if (focus) globeRef.current?.pointOfView({ lat: focus.lat, lng: focus.lon, altitude: 1.8 }, 1500);
  }, [focus]);

  return <div ref={containerRef} className="globe" data-testid="globe" />;
}
