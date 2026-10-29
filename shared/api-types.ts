// Antwortformate der API, gemeinsam für Server und Client.
import type { OMMJsonObject } from 'satellite.js';
import type { GroupId } from './groups.ts';
import type { DerivedOrbit } from './details.ts';
import type { Pass } from './passes.ts';

export interface GroupInfo {
  id: GroupId;
  label: string;
  count: number;
}

export interface SatelliteDetails {
  noradId: number;
  name: string;
  cosparId: string;
  groups: GroupId[];
  omm: OMMJsonObject;
  orbit: DerivedOrbit;
  /** Freitext aus data/notes.json – nicht vertrauenswürdige Fremddaten */
  note: string | null;
}

export interface PassesResponse {
  noradId: number;
  name: string;
  observer: { lat: number; lon: number };
  passes: Pass[];
}

export interface ApiError {
  error: string;
}
