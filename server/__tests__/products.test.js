/**
 * Product API tests
 * Tests: validation, craft enum, buyer cannot see pending, seller ownership
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const TEST_DB = process.env.TEST_DB_URL || 'mongodb://localhost:27017/kalaghar_test';

let app, User, Product;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  User = require('../model/user');
  Product = require('../model/product').Product;
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
});

async function createUserAndLogin(role = 'buyer') {
  const hashed = await bcrypt.hash('Password123', 12);
  const email = `${role}_${Date.now()}@test.in`;
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: hashed,
    role,
    ...(role === 'seller' ? { storeName: 'Test Store', kycStatus: 'approved' } : {}),
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123' });
  return { user, token: res.body.token };
}

describe('GET /api/products', () => {
  it('buyer only sees approved products', async () => {
    const { user: seller } = await createUserAndLogin('seller');
    await Product.create([
      { name: 'Approved Product', description: 'test', price: 100, stock: 10, quantity: 10, craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'approved' },
      { name: 'Pending Product', description: 'test', price: 200, stock: 10, quantity: 10, craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'pending' },
    ]);

    const { token: buyerToken } = await createUserAndLogin('buyer');
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    const names = res.body.products.map((p) => p.name);
    expect(names).toContain('Approved Product');
    expect(names).not.toContain('Pending Product');
  });

  it('filters by craft correctly', async () => {
    const { user: seller } = await createUserAndLogin('seller');
    await Product.create([
      { name: 'Pot', description: 'test', price: 100, stock: 10, quantity: 10, craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'approved' },
      { name: 'Textile', description: 'test', price: 100, stock: 10, quantity: 10, craft: 'textiles', images: ['img.jpg'], sellerId: seller._id, status: 'approved' },
    ]);

    const { token } = await createUserAndLogin('buyer');
    const res = await request(app)
      .get('/api/products?craft=pottery')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.products.every((p) => p.craft === 'pottery')).toBe(true);
  });

  it('returns pagination metadata', async () => {
    const { token } = await createUserAndLogin('buyer');
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('pages');
  });
});

describe('GET /api/products/:id', () => {
  it('buyer gets 404 for pending product', async () => {
    const { user: seller } = await createUserAndLogin('seller');
    const product = await Product.create({
      name: 'Pending Product', description: 'test', price: 100, stock: 10, quantity: 10,
      craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'pending',
    });

    const { token: buyerToken } = await createUserAndLogin('buyer');
    const res = await request(app)
      .get(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/products (create)', () => {
  it('rejects missing required fields', async () => {
    const { token: sellerToken } = await createUserAndLogin('seller');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Incomplete Product' }) // missing price, stock, craft, images
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid craft key', async () => {
    const { token: sellerToken } = await createUserAndLogin('seller');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Test Product',
        description: 'A test product',
        price: 100,
        stock: 10,
        craft: 'electronics', // invalid
      })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects negative price', async () => {
    const { token: sellerToken } = await createUserAndLogin('seller');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: 'Test', description: 'test', price: -100, stock: 10, craft: 'pottery' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('blocks buyer from creating products', async () => {
    const { token: buyerToken } = await createUserAndLogin('buyer');
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ name: 'Test', description: 'test', price: 100, stock: 10, craft: 'pottery' })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('PUT /api/products/:id (ownership)', () => {
  it('seller cannot edit another seller\'s product', async () => {
    const { user: seller1 } = await createUserAndLogin('seller');
    const { token: seller2Token } = await createUserAndLogin('seller');

    const product = await Product.create({
      name: 'Seller1 Product', description: 'test', price: 100, stock: 10, quantity: 10,
      craft: 'pottery', images: ['img.jpg'], sellerId: seller1._id, status: 'approved',
    });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ name: 'Hijacked Product' })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('PATCH /api/products/:id/status (admin only)', () => {
  it('admin can approve/reject a product', async () => {
    const { user: seller } = await createUserAndLogin('seller');
    const product = await Product.create({
      name: 'Pending Product', description: 'test', price: 100, stock: 10, quantity: 10,
      craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'pending',
    });

    const hashed = await bcrypt.hash('Admin@1234', 12);
    const adminEmail = `admin_${Date.now()}@test.in`;
    await User.create({ name: 'Admin', email: adminEmail, password: hashed, role: 'admin' });
    const adminRes = await request(app).post('/api/admin/login').send({ email: adminEmail, password: 'Admin@1234' });
    const adminToken = adminRes.body.token;

    const res = await request(app)
      .patch(`/api/products/${product._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(200);

    expect(res.body.status).toBe('approved');
  });

  it('seller cannot change product status', async () => {
    const { user: seller, token: sellerToken } = await createUserAndLogin('seller');
    const product = await Product.create({
      name: 'Pending Product', description: 'test', price: 100, stock: 10, quantity: 10,
      craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'approved' })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
