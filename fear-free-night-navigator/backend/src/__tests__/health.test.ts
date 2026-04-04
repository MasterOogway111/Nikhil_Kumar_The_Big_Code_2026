import request from 'supertest';
import app from '../app';

describe('Health Endpoint', () => {
  test('GET /health returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBeDefined();
  });

  test('GET /health returns timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
  });
});
