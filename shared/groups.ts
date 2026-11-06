// CelesTrak-Gruppen, die der Prototyp kennt. `id` ist der GROUP-Parameter von CelesTrak.
export const GROUPS = [
  { id: 'stations', label: 'Raumstationen' },
  { id: 'visual', label: 'Mit bloßem Auge' },
  { id: 'weather', label: 'Wetter' },
  { id: 'gps-ops', label: 'GPS' },
  { id: 'starlink', label: 'Starlink' },
  { id: 'active', label: 'Alle aktiven' },
] as const;

export type GroupId = (typeof GROUPS)[number]['id'];

export const isGroupId = (value: string): value is GroupId =>
  GROUPS.some((g) => g.id === value);

export const ISS_NORAD_ID = 25544;
