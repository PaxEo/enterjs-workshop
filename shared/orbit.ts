// Bahnlogik als reine Funktionen: läuft im Browser und im Node-Backend.
import {
  type OMMJsonObject,
  type PositionAndVelocity,
  type SatRec,
  degreesLat,
  degreesLong,
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  radiansToDegrees,
} from 'satellite.js';

export interface Satellite {
  noradId: number;
  name: string;
  satrec: SatRec;
}

export interface Observer {
  /** Grad */
  lat: number;
  /** Grad */
  lon: number;
  /** Meter über NN */
  heightM?: number;
}

export interface SubPoint {
  lat: number;
  lon: number;
  altKm: number;
}

export function toSatellite(omm: OMMJsonObject): Satellite | null {
  try {
    const satrec = json2satrec(omm);
    return { noradId: Number(omm.NORAD_CAT_ID), name: String(omm.OBJECT_NAME), satrec };
  } catch {
    return null;
  }
}

function stateAt(sat: Satellite, date: Date): PositionAndVelocity | null {
  return propagate(sat.satrec, date);
}

export function subPointAt(sat: Satellite, date: Date): SubPoint | null {
  const pv = stateAt(sat, date);
  if (!pv) return null;
  const gd = eciToGeodetic(pv.position, gstime(date));
  return { lat: degreesLat(gd.latitude), lon: degreesLong(gd.longitude), altKm: gd.height };
}

/** Bahngeschwindigkeit in km/s */
export function speedKmS(sat: Satellite, date: Date): number | null {
  const pv = stateAt(sat, date);
  if (!pv) return null;
  const { x, y, z } = pv.velocity;
  return Math.hypot(x, y, z);
}

function observerGd(obs: Observer) {
  return {
    latitude: degreesToRadians(obs.lat),
    longitude: degreesToRadians(obs.lon),
    height: (obs.heightM ?? 0) / 1000,
  };
}

/** Höhe des Satelliten über dem Horizont des Beobachters in Grad */
export function elevationDeg(sat: Satellite, obs: Observer, date: Date): number | null {
  const pv = stateAt(sat, date);
  if (!pv) return null;
  const look = ecfToLookAngles(observerGd(obs), eciToEcf(pv.position, gstime(date)));
  return radiansToDegrees(look.elevation);
}

/** Bahn als Liste von Unterpunkten, z. B. für die Bahnlinie auf dem Globus */
export function groundTrack(
  sat: Satellite,
  center: Date,
  minutesBefore = 45,
  minutesAfter = 45,
  stepSeconds = 60,
): SubPoint[] {
  const points: SubPoint[] = [];
  const start = center.getTime() - minutesBefore * 60_000;
  const end = center.getTime() + minutesAfter * 60_000;
  for (let t = start; t <= end; t += stepSeconds * 1000) {
    const p = subPointAt(sat, new Date(t));
    if (p) points.push(p);
  }
  return points;
}

/** Umlaufzeit in Minuten aus der mittleren Bewegung des SGP4-Datensatzes (rad/min) */
export function periodMinutes(sat: Satellite): number {
  return (2 * Math.PI) / sat.satrec.no;
}

/** Bahnlinie über genau einen Umlauf, zentriert auf `center`, mit etwa 120 Punkten */
export function orbitTrack(sat: Satellite, center: Date): SubPoint[] {
  const period = periodMinutes(sat);
  const stepSeconds = Math.max(30, Math.round((period * 60) / 120));
  return groundTrack(sat, center, period / 2, period / 2, stepSeconds);
}

/** Bahnlinie an der Datumsgrenze auftrennen, sonst zieht der Globus eine Linie quer über die Erde */
export function splitAtDateLine(points: SubPoint[]): SubPoint[][] {
  const segments: SubPoint[][] = [[]];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && Math.abs(points[i].lon - points[i - 1].lon) > 180) segments.push([]);
    segments[segments.length - 1].push(points[i]);
  }
  return segments.filter((s) => s.length > 1);
}
