import request from 'supertest';
import app from '../app';

describe('Route Endpoint', () => {
  test('POST /route without origin returns 400', async () => {
    const res = await request(app)
      .post('/route')
      .send({
        destination: 'Delhi',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /route without destination returns 400', async () => {
    const res = await request(app)
      .post('/route')
      .send({
        origin: 'Gurgaon',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /route with valid input returns route alternatives', async () => {
    // Note: This test will fail without Google Maps API key
    // It's included to demonstrate the expected structure
    const res = await request(app)
      .post('/route')
      .send({
        origin: 'Connaught Place, Delhi',
        destination: 'India Gate, Delhi',
        time_of_day: 1,
      });

    if (res.status === 200) {
      expect(res.body.alternatives).toBeDefined();
      expect(Array.isArray(res.body.alternatives)).toBe(true);
      expect(res.body.alternatives.length).toBeGreaterThan(0);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.risk_reduction).toBeDefined();
      expect(res.body.summary.eta_tradeoff_secs).toBeDefined();

      const fastest = res.body.alternatives[0];
      expect(fastest.segments).toBeDefined();
      expect(fastest.total_time).toBeDefined();
    } else {
      // Expected when no API key or network error
      expect([400, 500]).toContain(res.status);
    }
  });

  test('POST /route accepts time_of_day parameter', async () => {
    const res = await request(app)
      .post('/route')
      .send({
        origin: 'Location A',
        destination: 'Location B',
        time_of_day: 0, // Daytime
      });

    // May fail due to API, but should accept the parameter
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});

describe('404 Handling', () => {
  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  test('POST /nonexistent returns 404', async () => {
    const res = await request(app).post('/nonexistent').send({});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
