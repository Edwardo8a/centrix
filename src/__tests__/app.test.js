const request = require('supertest');
const app = require('../../src/app');

describe('App Integration', () => {
  it('debe retornar 200 en el endpoint /health', async () => {
    // Arrange & Act
    const response = await request(app).get('/health');

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });
});
