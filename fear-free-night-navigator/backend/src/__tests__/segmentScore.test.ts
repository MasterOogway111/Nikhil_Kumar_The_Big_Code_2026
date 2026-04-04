import request from 'supertest';
import app from '../app';

describe('Segment Score Endpoint', () => {
  const validFeatures = {
    poi_density: 0.4,
    commercial_activity: 0.5,
    road_isolation: 0.3,
    connectivity: 0.6,
    lighting_proxy: 0.7,
    time_of_day: 1,
  };

  test('POST /segment-score with valid input returns risk score', async () => {
    const res = await request(app)
      .post('/segment-score')
      .send({
        segmentId: `test_${Date.now()}`,
        polyline: 'test_polyline',
        features: validFeatures,
      });

    expect(res.status).toBe(200);
    expect(res.body.risk_score).toBeDefined();
    expect(typeof res.body.risk_score).toBe('number');
    expect(res.body.risk_score).toBeGreaterThanOrEqual(0);
    expect(res.body.risk_score).toBeLessThanOrEqual(1);
    expect(res.body.uncertainty).toBeDefined();
  });

  test('POST /segment-score without segmentId returns 400', async () => {
    const res = await request(app)
      .post('/segment-score')
      .send({
        features: validFeatures,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /segment-score without features returns 400', async () => {
    const res = await request(app)
      .post('/segment-score')
      .send({
        segmentId: 'test_123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /segment-score returns deterministic output for same input', async () => {
    const segmentId = `det_test_${Date.now()}`;
    const payload = {
      segmentId,
      polyline: 'test_polyline',
      features: validFeatures,
    };

    const res1 = await request(app).post('/segment-score').send(payload);
    const res2 = await request(app).post('/segment-score').send(payload);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.risk_score).toBe(res2.body.risk_score);
  });

  test('POST /segment-score with missing POI density handles gracefully', async () => {
    const res = await request(app)
      .post('/segment-score')
      .send({
        segmentId: `test_missing_poi_${Date.now()}`,
        polyline: 'test_polyline',
        features: {
          poi_density: -1, // Missing POI data
          commercial_activity: 0.5,
          road_isolation: 0.3,
          connectivity: 0.6,
          lighting_proxy: 0.7,
          time_of_day: 1,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.risk_score).toBeDefined();
    expect(res.body.uncertainty).toBeGreaterThan(0.2); // Higher uncertainty when POI missing
  });
});
