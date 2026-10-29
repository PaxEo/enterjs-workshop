// Überflugvorhersage: Wann steht ein Satellit über dem Horizont, und wann ist er sichtbar?
import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  jday,
  propagate,
  radiansToDegrees,
  shadowFraction,
  sunPos,
} from 'satellite.js';
import { type Observer, type Satellite, elevationDeg } from './orbit.ts';

const AU_KM = 149_597_870.7;

export interface Pass {
  start: string;
  max: string;
  end: string;
  maxElevationDeg: number;
  /** Abschnitt, in dem der Satellit beleuchtet und der Beobachter im Dunkeln ist */
  visible: { start: string; end: string } | null;
}

export interface PassOptions {
  days?: number;
  /** Mindest-Elevation, ab der ein Überflug zählt */
  minElevationDeg?: number;
  /** Sonne muss mindestens so weit unter dem Horizont stehen (bürgerliche Dämmerung: -6°) */
  maxSunElevationDeg?: number;
  stepSeconds?: number;
}

/** Sonnenhöhe über dem Horizont des Beobachters in Grad */
export function sunElevationDeg(obs: Observer, date: Date): number {
  const { rsun } = sunPos(jday(date));
  const sunEciKm = { x: rsun.x * AU_KM, y: rsun.y * AU_KM, z: rsun.z * AU_KM };
  const observerGd = {
    latitude: degreesToRadians(obs.lat),
    longitude: degreesToRadians(obs.lon),
    height: (obs.heightM ?? 0) / 1000,
  };
  const look = ecfToLookAngles(observerGd, eciToEcf(sunEciKm, gstime(date)));
  return radiansToDegrees(look.elevation);
}

/** true, wenn der Satellit von der Sonne beleuchtet wird (höchstens halb im Halbschatten) */
export function isSunlit(sat: Satellite, date: Date): boolean {
  const pv = propagate(sat.satrec, date);
  if (!pv) return false;
  return shadowFraction(sunPos(jday(date)).rsun, pv.position) < 0.5;
}

export function predictPasses(
  sat: Satellite,
  obs: Observer,
  from: Date,
  { days = 3, minElevationDeg = 10, maxSunElevationDeg = -6, stepSeconds = 20 }: PassOptions = {},
): Pass[] {
  const passes: Pass[] = [];
  const endMs = from.getTime() + days * 86_400_000;
  const stepMs = stepSeconds * 1000;

  interface Open {
    start: number;
    max: number;
    maxEl: number;
    visStart: number | null;
    visEnd: number | null;
  }
  let current: Open | null = null;

  const close = (p: Open, end: number): Pass => {
    const iso = (ms: number) => new Date(ms).toISOString();
    return {
      start: iso(p.start),
      max: iso(p.max),
      end: iso(end),
      maxElevationDeg: Math.round(p.maxEl * 10) / 10,
      visible: p.visStart !== null && p.visEnd !== null ? { start: iso(p.visStart), end: iso(p.visEnd) } : null,
    };
  };

  for (let t = from.getTime(); t <= endMs; t += stepMs) {
    const date = new Date(t);
    const el = elevationDeg(sat, obs, date);
    if (el === null) break; // Bahn zerfallen oder ungültig

    if (el >= minElevationDeg) {
      current ??= { start: t, max: t, maxEl: el, visStart: null, visEnd: null };
      if (el > current.maxEl) {
        current.maxEl = el;
        current.max = t;
      }
      if (sunElevationDeg(obs, date) <= maxSunElevationDeg && isSunlit(sat, date)) {
        current.visStart ??= t;
        current.visEnd = t;
      }
    } else if (current) {
      passes.push(close(current, t - stepMs));
      current = null;
    }
  }
  if (current) passes.push(close(current, endMs));
  return passes;
}
