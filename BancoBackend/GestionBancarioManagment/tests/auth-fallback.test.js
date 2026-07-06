import request from 'supertest';

process.env.DB_DIALECT = 'postgres';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'gestionbanco';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = 'postgres';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '3006';

const { createApp } = await import('../configs/app.js');
const { sequelize } = await import('../configs/db.js');

let app;

describe('Auth endpoints fallback', () => {
  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('register and login work when postgres is unavailable', async () => {
    const registerResponse = await request(app)
      .post('/gestionbanco/v1/auth/register')
      .send({
        nombre: 'Usuario Prueba',
        email: 'prueba@example.com',
        password: 'Password123!',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);

    const loginResponse = await request(app)
      .post('/gestionbanco/v1/auth/login')
      .send({
        email: 'prueba@example.com',
        password: 'Password123!',
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
  });
});
