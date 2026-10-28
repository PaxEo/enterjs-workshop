// Abgeleitete Bahnparameter aus einem OMM-Datensatz (CelesTrak-Format).
import type { OMMJsonObject } from 'satellite.js';

const MU_KM3_S2 = 398_600.4418;
const EARTH_EQUATORIAL_RADIUS_KM = 6378.137;

export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'andere';

export interface DerivedOrbit {
  periodMin: number;
  revsPerDay: number;
  semiMajorAxisKm: number;
  perigeeKm: number;
  apogeeKm: number;
  inclinationDeg: number;
  eccentricity: number;
  orbitType: OrbitType;
  /** Startjahr aus der internationalen Kennung (COSPAR-ID), z. B. 1998-067A */
  launchYear: number | null;
  epoch: string;
  revolutionAtEpoch: number;
  bstar: number;
}

export function deriveOrbit(omm: OMMJsonObject): DerivedOrbit {
  const meanMotion = Number(omm.MEAN_MOTION); // Umläufe pro Tag
  const eccentricity = Number(omm.ECCENTRICITY);
  const periodS = 86_400 / meanMotion;
  const semiMajorAxisKm = Math.cbrt(MU_KM3_S2 * (periodS / (2 * Math.PI)) ** 2);
  const perigeeKm = semiMajorAxisKm * (1 - eccentricity) - EARTH_EQUATORIAL_RADIUS_KM;
  const apogeeKm = semiMajorAxisKm * (1 + eccentricity) - EARTH_EQUATORIAL_RADIUS_KM;
  const year = /^(\d{4})-/.exec(String(omm.OBJECT_ID ?? ''))?.[1];

  return {
    periodMin: periodS / 60,
    revsPerDay: meanMotion,
    semiMajorAxisKm,
    perigeeKm,
    apogeeKm,
    inclinationDeg: Number(omm.INCLINATION),
    eccentricity,
    orbitType: classifyOrbit(perigeeKm, apogeeKm, eccentricity),
    launchYear: year ? Number(year) : null,
    epoch: `${omm.EPOCH}Z`,
    revolutionAtEpoch: Number(omm.REV_AT_EPOCH ?? 0),
    bstar: Number(omm.BSTAR ?? 0),
  };
}

export function classifyOrbit(perigeeKm: number, apogeeKm: number, eccentricity: number): OrbitType {
  if (eccentricity > 0.25) return 'HEO';
  if (apogeeKm < 2000) return 'LEO';
  if (perigeeKm > 35_286 && apogeeKm < 36_286) return 'GEO';
  if (perigeeKm >= 2000 && apogeeKm < 35_286) return 'MEO';
  return 'andere';
}
