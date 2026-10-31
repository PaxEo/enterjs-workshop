import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';

const app = createApp();

describe('GET /api/satellites/search', () => {
  it('findet Satelliten über alle Gruppen', async () => {
    const res = await request(app).get('/api/satellites/search?q=hst').expect(200);
    expect(res.body.results).toContainEqual(expect.objectContaining({ noradId: 20580, name: 'HST' }));
  });

  it('sortiert Treffer am Namensanfang nach vorn', async () => {
    const res = await request(app).get('/api/satellites/search?q=iss').expect(200);
    expect(res.body.results[0].name.toLowerCase().startsWith('iss')).toBe(true);
  });

  it('findet über die exakte NORAD-ID', async () => {
    const res = await request(app).get('/api/satellites/search?q=25544').expect(200);
    expect(res.body.results[0]).toMatchObject({ noradId: 25544 });
  });

  it('begrenzt die Treffer und meldet die Gesamtzahl', async () => {
    const res = await request(app).get('/api/satellites/search?q=starlink&limit=5').expect(200);
    expect(res.body.results).toHaveLength(5);
    expect(res.body.total).toBeGreaterThan(1000);
  });

  it.each([
    ['fehlendem Suchbegriff', ''],
    ['zu kurzem Suchbegriff', '?q=a'],
    ['zu langem Suchbegriff', `?q=${'x'.repeat(51)}`],
    ['limit über 50', '?q=iss&limit=500'],
    ['limit keine Zahl', '?q=iss&limit=viele'],
  ])('antwortet mit 400 bei %s', async (_label, query) => {
    const res = await request(app).get(`/api/satellites/search${query}`).expect(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
