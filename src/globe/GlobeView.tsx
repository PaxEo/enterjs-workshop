import Globe from 'globe.gl';
import type * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { ISS_NORAD_ID } from '../../shared/groups.ts';
import {
  type Observer,
  type Satellite,
  type SubPoint,
  groundTrack,
  splitAtDateLine,
  subPointAt,
} from '../../shared/orbit.ts';
import { useClock } from '../clock.ts';
import { bearingDeg, createIssModel } from './issModel.ts';

const EARTH_RADIUS_KM = 6371;
const UPDATE_INTERVAL_MS = 250;
const TRACK_REFRESH_SIM_MS = 30_000;
// Größe des „Du“-Labels in Grad bei Kamerahöhe 1 (Erdradien); skaliert linear mit dem Zoom
const LABEL_SIZE_PER_ALT = 0.4;
const LABEL_DOT_PER_ALT = 0.17;
const START_ALTITUDE = 3;
// Feste Größe des ISS-Modells in Globus-Einheiten (Erdradius = 100 = 6371 km), skaliert also mit dem Zoom wie die Erde.
// 4 Einheiten ≈ 255 km Spannweite; maßstäblich (109 m ≈ 0,002 Einheiten) wäre das Modell unsichtbar.
const ISS_SIZE = 4;
// Zeitabstand für die Flugrichtung des Modells
const HEADING_STEP_MS = 10_000;
// Objekte so nah an der ISS gelten als angedockt (Module, Kapseln) und werden nicht als Punkt gezeigt,
// sonst verdecken sie das Modell und fangen Klicks ab
const DOCKED_MAX_DEG = 0.3;
const DOCKED_MAX_ALT_KM = 20;

export interface FrameStats {
  fps: number;
  propagationMs: number;
  rendered: number;
}

interface Props {
  satellites: Satellite[];
  selectedId: number | null;
  observer: Observer & { label?: string };
  onSelect: (noradId: number) => void;
  onStats?: (stats: FrameStats) => void;
}

interface IssDatum {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
}

interface Particle {
  noradId: number;
  lat: number;
  lng: number;
  alt: number;
}

export function GlobeView({ satellites, selectedId, observer, onSelect, onStats }: Props) {
  const clock = useClock();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<InstanceType<typeof Globe> | null>(null);

  // Aktuelle Props für die Update-Schleife, ohne sie bei jeder Änderung neu zu starten
  const live = useRef({ satellites, selectedId, onSelect, onStats });
  useEffect(() => {
    live.current = { satellites, selectedId, onSelect, onStats };
  });

  useEffect(() => {
    const el = containerRef.current!;
    const highlight: Particle[] = [];
    const issModel = createIssModel();
    issModel.scale.setScalar(ISS_SIZE);
    // Dasselbe Datenobjekt bei jedem Update, damit globe.gl das Modell wiederverwendet statt neu anzulegen
    const issDatum: IssDatum = { lat: 0, lng: 0, alt: 0, heading: 0 };

    const globe = new Globe(el)
      .globeImageUrl('/earth-blue-marble-8k.jpg')
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
      .pathColor(() => 'rgba(255, 140, 90, 0.9)')
      .pathStroke(1.5)
      .pathTransitionDuration(0)
      .labelLat('lat')
      .labelLng('lng')
      .labelText('text')
      .labelColor(() => 'gold')
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude('alt')
      .objectFacesSurface(true)
      // Modell in Flugrichtung drehen: lokales +Y (Norden) um die Hochachse auf den Kurs
      .objectRotation((d: object) => ({ z: -(d as IssDatum).heading }))
      .objectThreeObject(() => issModel)
      .onObjectClick(() => live.current.onSelect(ISS_NORAD_ID));
    // Label-Größe an die Kamerahöhe koppeln, damit es auf dem Bildschirm gleich groß bleibt
    const scaleLabels = (altitude: number) => {
      globe.labelSize(altitude * LABEL_SIZE_PER_ALT).labelDotRadius(altitude * LABEL_DOT_PER_ALT);
    };
    scaleLabels(START_ALTITUDE);
    globe.onZoom(({ altitude }) => scaleLabels(altitude));
    globe.pointOfView({ lat: 30, lng: 10, altitude: START_ALTITUDE });
    globeRef.current = globe;
    // Nur in der Entwicklung: Zugriff für Browser-Tests (Kamera setzen)
    if (import.meta.env.DEV) (window as unknown as { __globe?: unknown }).__globe = globe;

    const resize = new ResizeObserver(() => globe.width(el.clientWidth).height(el.clientHeight));
    resize.observe(el);

    let frames = 0;
    let raf = 0;
    const countFrame = () => {
      frames++;
      issModel.userData.animate?.(performance.now());
      raf = requestAnimationFrame(countFrame);
    };
    raf = requestAnimationFrame(countFrame);

    let trackFor: number | null = null;
    let trackAt = 0;
    let propSum = 0;
    let updates = 0;
    let rendered = 0;

    const update = () => {
      const { satellites: sats, selectedId: selected } = live.current;
      const focusId = selected ?? ISS_NORAD_ID;
      const now = clock.now();

      const t0 = performance.now();
      const others: Particle[] = [];
      highlight.length = 0;
      let focusSat: Satellite | undefined;
      // Die ISS erscheint als 3D-Modell statt als Punkt
      const issSat = sats.find((s) => s.noradId === ISS_NORAD_ID);
      const issPoint = issSat && subPointAt(issSat, now);
      if (issSat && issPoint) {
        const ahead = subPointAt(issSat, new Date(now.getTime() + HEADING_STEP_MS));
        Object.assign(issDatum, { lat: issPoint.lat, lng: issPoint.lon, alt: issPoint.altKm / EARTH_RADIUS_KM });
        if (ahead) issDatum.heading = bearingDeg(issPoint, ahead);
        if (focusId === ISS_NORAD_ID) focusSat = issSat;
      }
      const dockedToIss = (p: SubPoint) =>
        !!issPoint &&
        Math.abs(p.lat - issPoint.lat) < DOCKED_MAX_DEG &&
        Math.abs(((p.lon - issPoint.lon + 540) % 360) - 180) < DOCKED_MAX_DEG &&
        Math.abs(p.altKm - issPoint.altKm) < DOCKED_MAX_ALT_KM;

      for (const s of sats) {
        if (s === issSat) continue;
        const p = subPointAt(s, now);
        if (!p) continue;
        const particle = { noradId: s.noradId, lat: p.lat, lng: p.lon, alt: p.altKm / EARTH_RADIUS_KM };
        if (s.noradId === focusId) {
          highlight.push(particle);
          focusSat = s;
        } else if (!dockedToIss(p)) {
          others.push(particle);
        }
      }
      propSum += performance.now() - t0;
      updates++;
      rendered = others.length + highlight.length + (issPoint ? 1 : 0);

      globe.particlesData([others, highlight]);
      globe.objectsData(issPoint ? [issDatum] : []);

      if (focusSat && (trackFor !== focusId || Math.abs(now.getTime() - trackAt) > TRACK_REFRESH_SIM_MS)) {
        globe.pathsData(splitAtDateLine(groundTrack(focusSat, now)).map((points) => ({ points })));
        trackFor = focusId;
        trackAt = now.getTime();
      } else if (!focusSat && trackFor !== null) {
        globe.pathsData([]);
        trackFor = null;
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
      issModel.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      el.innerHTML = '';
      globeRef.current = null;
    };
  }, [clock]);

  useEffect(() => {
    const text = observer.label ? `Du · ${observer.label}` : 'Du';
    globeRef.current?.labelsData([{ lat: observer.lat, lng: observer.lon, text }]);
  }, [observer.lat, observer.lon, observer.label]);

  return <div ref={containerRef} className="globe" data-testid="globe" />;
}
