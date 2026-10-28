import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.ts';

const app = createApp();

describe('GET /api/groups', () => {
  it('liefert alle Gruppen mit Anzahl', async () => {
    const res = await request(app).get('/api/groups').expect(200);
    expect(res.body).toContainEqual(expect.objectContaining({ id: 'stations', count: expect.any(Number) }));
  });

  it('liefert die Bahndaten einer Gruppe', async () => {
    const res = await request(app).get('/api/groups/stations').expect(200);
    expect(res.body).toContainEqual(expect.objectContaining({ NORAD_CAT_ID: 25544 }));
  });

  it('antwortet mit 404 bei unbekannter Gruppe', async () => {
    await request(app).get('/api/groups/ufos').expect(404);
  });
});

describe('GET /api/satellites/:noradId', () => {
  it('liefert Details zur ISS', async () => {
    const res = await request(app).get('/api/satellites/25544').expect(200);
    expect(res.body).toMatchObject({
      noradId: 25544,
      cosparId: '1998-067A',
      groups: expect.arrayContaining(['stations']),
      orbit: expect.objectContaining({ orbitType: 'LEO', launchYear: 1998 }),
    });
  });

  it('antwortet mit 400 bei ungültiger ID', async () => {
    await request(app).get('/api/satellites/abc').expect(400);
  });

  it('antwortet mit 404 bei unbekannter ID', async () => {
    await request(app).get('/api/satellites/999999999').expect(404);
  });
});
