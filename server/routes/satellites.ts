import { Router } from 'express';
import { z } from 'zod';
import type { SatelliteDetails, SatelliteSearchResponse } from '../../shared/api-types.ts';
import { deriveOrbit } from '../../shared/details.ts';
import { noteFor, satelliteIndex } from '../data.ts';

export const satellitesRouter = Router();

const searchQuery = z.object({
  q: z.string().trim().min(2).max(50),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Muss vor '/:noradId' stehen, sonst landet „search“ als NORAD-ID im falschen Handler
satellitesRouter.get('/search', (req, res) => {
  const parsed = searchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }
  const { q, limit } = parsed.data;
  const needle = q.toLowerCase();
  const matches = [...satelliteIndex().entries()]
    .filter(([noradId, { omm }]) => String(omm.OBJECT_NAME).toLowerCase().includes(needle) || String(noradId) === q)
    .map(([noradId, { omm, groups }]) => ({ noradId, name: String(omm.OBJECT_NAME), groups }))
    // Treffer am Namensanfang zuerst, dann alphabetisch
    .sort(
      (a, b) =>
        Number(!a.name.toLowerCase().startsWith(needle)) - Number(!b.name.toLowerCase().startsWith(needle)) ||
        a.name.localeCompare(b.name),
    );

  const body: SatelliteSearchResponse = { query: q, total: matches.length, results: matches.slice(0, limit) };
  res.json(body);
});

const detailParams = z.object({
  noradId: z.coerce.number().int().positive(),
});

satellitesRouter.get('/:noradId', (req, res) => {
  const parsed = detailParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }
  const { noradId } = parsed.data;
  const entry = satelliteIndex().get(noradId);
  if (!entry) {
    res.status(404).json({ error: `Satellit ${noradId} nicht gefunden` });
    return;
  }
  const details: SatelliteDetails = {
    noradId,
    name: String(entry.omm.OBJECT_NAME),
    cosparId: String(entry.omm.OBJECT_ID ?? ''),
    groups: entry.groups,
    omm: entry.omm,
    orbit: deriveOrbit(entry.omm),
    note: noteFor(noradId),
  };
  res.json(details);
});
