/**
 * Auth API tests
 * Tests: register, login, invalid credentials, JWT protection, role enforcement
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

// Use in-memory or test DB
const TEST_DB = process.env.TEST_DB_URL || 'mongodb://localhost:27017/kalaghar_test';

let app;
let User;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  User = require('../model/user');
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  const validPayload = {
    name: 'Test Buyer',
    email: 'test@kalaghar.in',
    password: 'Password123',
    role: 'buyer',
  };

  it('registers a new buyer successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload)
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.role).toBe('buyer');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects registration with password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, password: 'short' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validPayload);
    const res = await request(app)
      .post('/api/auth/register')
      .send(validPayload)
      .expect(400);

    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, email: 'not-an-email' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, role: 'admin' }) // cannot self-register as admin
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('registers a seller with store name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Artisan User',
        email: 'artisan@test.in',
        password: 'Password123',
        role: 'seller',
        storeName: 'Test Artisan Store',
        craft: 'pottery',
      })
      .expect(201);

    expect(res.body.user.role).toBe('seller');
    expect(res.body.user.storeName).toBe('Test Artisan Store');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const hashed = await bcrypt.hash('Password123', 12);
    await User.create({ name: 'Test User', email: 'test@kalaghar.in', password: hashed, role: 'buyer' });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@kalaghar.in', password: 'Password123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@kalaghar.in');
  });

  it('rejects wrong password with generic error (no credential enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@kalaghar.in', password: 'WrongPassword' })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    // Should not reveal whether email or password was wrong
    expect(res.body.error.message).toContain('Invalid email or password');
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@kalaghar.in', password: 'Password123' })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('JWT protection on protected routes', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.error.code).toBe('NO_TOKEN');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });
});

describe('POST /api/admin/login', () => {
  beforeEach(async () => {
    const hashed = await bcrypt.hash('Admin@1234', 12);
    await User.create({ name: 'Admin', email: 'admin@kalaghar.in', password: hashed, role: 'admin' });
  });

  it('allows admin login via dedicated endpoint', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@kalaghar.in', password: 'Admin@1234' })
      .expect(200);

    expect(res.body.user.role).toBe('admin');
  });

  it('rejects non-admin user at admin login endpoint', async () => {
    const hashed = await bcrypt.hash('Password123', 12);
    await User.create({ name: 'Buyer', email: 'buyer@kalaghar.in', password: hashed, role: 'buyer' });

    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'buyer@kalaghar.in', password: 'Password123' })
      .expect(401);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Role enforcement on admin routes', () => {
  let buyerToken;

  beforeEach(async () => {
    const hashed = await bcrypt.hash('Password123', 12);
    await User.create({ name: 'Buyer', email: 'buyer@test.in', password: hashed, role: 'buyer' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.in', password: 'Password123' });
    buyerToken = res.body.token;
  });

  it('rejects buyer token on admin-only endpoint', async () => {
    const res = await request(app)
      .get('/api/admin/summary')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
