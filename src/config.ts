import type { GroupId } from '../shared/groups.ts';
import type { Observer } from '../shared/orbit.ts';

/** Gruppen, die beim Start geladen werden */
export const DEFAULT_GROUPS: GroupId[] = ['stations', 'visual'];

/** Beobachter-Standort, solange keine Ortung möglich ist */
export const DEFAULT_OBSERVER: Observer & { label: string } = { lat: 50.94, lon: 6.96, label: 'Köln' };
