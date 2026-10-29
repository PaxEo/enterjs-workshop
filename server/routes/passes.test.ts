import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';

const app = createApp();

describe('GET /api/passes', () => {
  it('liefert ISS-Überflüge für Köln', async () => {
    const res = await request(app).get('/api/passes?lat=50.94&lon=6.96&days=2').expect(200);
    expect(res.body).toMatchObject({ noradId: 25544, observer: { lat: 50.94, lon: 6.96 } });
    expect(res.body.passes.length).toBeGreaterThan(0);
    expect(res.body.passes[0]).toEqual(
      expect.objectContaining({ start: expect.any(String), maxElevationDeg: expect.any(Number) }),
    );
  });

  it.each([
    ['fehlende Koordinaten', ''],
    ['Breite außerhalb', '?lat=91&lon=0'],
    ['Länge keine Zahl', '?lat=50&lon=abc'],
    ['zu viele Tage', '?lat=50&lon=7&days=30'],
  ])('antwortet mit 400 bei %s', async (_label, query) => {
    const res = await request(app).get(`/api/passes${query}`).expect(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('antwortet mit 404 bei unbekanntem Satelliten', async () => {
    await request(app).get('/api/passes?lat=50&lon=7&norad=999999999').expect(404);
  });
});
