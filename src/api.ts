import type { OMMJsonObject } from 'satellite.js';
import type { GroupInfo, PassesResponse } from '../shared/api-types.ts';
import type { GroupId } from '../shared/groups.ts';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

export const fetchGroups = () => getJson<GroupInfo[]>('/api/groups');

export const fetchGroup = (id: GroupId) => getJson<OMMJsonObject[]>(`/api/groups/${id}`);

export const fetchPasses = (lat: number, lon: number, days = 5) =>
  getJson<PassesResponse>(`/api/passes?lat=${lat}&lon=${lon}&days=${days}`);
