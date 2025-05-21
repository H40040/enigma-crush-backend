const request = require('supertest');
const app = require('../index.js');

describe('API Health', () => {
  it('deve responder na raiz com status 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });
});
