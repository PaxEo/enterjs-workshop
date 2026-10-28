import { Router } from 'express';
import { z } from 'zod';
import type { SatelliteDetails } from '../../shared/api-types.ts';
import { deriveOrbit } from '../../shared/details.ts';
import { noteFor, satelliteIndex } from '../data.ts';

export const satellitesRouter = Router();

const params = z.object({
  noradId: z.coerce.number().int().positive(),
});

satellitesRouter.get('/:noradId', (req, res) => {
  const parsed = params.safeParse(req.params);
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
