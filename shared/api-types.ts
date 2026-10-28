// Antwortformate der API, gemeinsam für Server und Client.
import type { OMMJsonObject } from 'satellite.js';
import type { GroupId } from './groups.ts';
import type { DerivedOrbit } from './details.ts';

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

export interface ApiError {
  error: string;
}
