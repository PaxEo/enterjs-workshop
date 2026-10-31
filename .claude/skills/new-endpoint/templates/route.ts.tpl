import { Router } from 'express';
import { z } from 'zod';
import type { __Name__Response } from '../../shared/api-types.ts';

export const __name__Router = Router();

const query = z.object({
  // Beispiel: q: z.string().trim().min(2).max(50),
});

__name__Router.get('/', (req, res) => {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error) });
    return;
  }

  const body: __Name__Response = {
    // …
  };
  res.json(body);
});
