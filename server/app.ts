import express from 'express';
import { groupsRouter } from './routes/groups.ts';
import { satellitesRouter } from './routes/satellites.ts';

export function createApp() {
  const app = express();
  app.use('/api/groups', groupsRouter);
  app.use('/api/satellites', satellitesRouter);
  return app;
}
