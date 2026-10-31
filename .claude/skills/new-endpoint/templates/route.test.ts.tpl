import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.ts';

const app = createApp();

describe('GET /api/__name__', () => {
  it('liefert … für gültige Eingaben', async () => {
    const res = await request(app).get('/api/__name__?…').expect(200);
    expect(res.body).toMatchObject({
      // …
    });
  });

  it.each([
    // ['Beschreibung der Regel', '?ungültige=query'],
  ])('antwortet mit 400 bei %s', async (_label, query) => {
    const res = await request(app).get(`/api/__name__${query}`).expect(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
