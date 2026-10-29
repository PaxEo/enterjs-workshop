import { Router } from 'express';
import { z } from 'zod';
import type { PassesResponse } from '../../shared/api-types.ts';
import { ISS_NORAD_ID } from '../../shared/groups.ts';
import { toSatellite } from '../../shared/orbit.ts';
import { predictPasses } from '../../shared/passes.ts';
import { satelliteIndex } from '../data.ts';

export const passesRouter = Router();

const query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  norad: z.coerce.number().int().positive().default(ISS_NORAD_ID),
  days: z.coerce.number().int().min(1).max(10).default(5),
});

passesRouter.get('/', (req, res) => {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }
  const { lat, lon, norad, days } = parsed.data;
  const entry = satelliteIndex().get(norad);
  const sat = entry && toSatellite(entry.omm);
  if (!sat) {
    res.status(404).json({ error: `Satellit ${norad} nicht gefunden` });
    return;
  }
  const body: PassesResponse = {
    noradId: norad,
    name: sat.name,
    observer: { lat, lon },
    passes: predictPasses(sat, { lat, lon }, new Date(), { days }),
  };
  res.json(body);
});
