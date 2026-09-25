/**
 * Coupon validation tests
 * Tests: expired code rejected, invalid code rejected, min order value, server-side discount calculation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const TEST_DB = process.env.TEST_DB_URL || 'mongodb://localhost:27017/kalaghar_test';

let app, User, Coupon;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  User = require('../model/user');
  Coupon = require('../model/coupon');
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
  await Coupon.deleteMany({});
});

async function getBuyerToken() {
  const hashed = await bcrypt.hash('Password123', 12);
  const email = `buyer_${Date.now()}@test.in`;
  await User.create({ name: 'Buyer', email, password: hashed, role: 'buyer' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return res.body.token;
}

async function getAdminId() {
  const hashed = await bcrypt.hash('Admin@1234', 12);
  const email = `admin_${Date.now()}@test.in`;
  const admin = await User.create({ name: 'Admin', email, password: hashed, role: 'admin' });
  return admin._id;
}

describe('POST /api/coupons/validate', () => {
  it('rejects an invalid coupon code', async () => {
    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'NONEXISTENT', orderTotal: 1000 })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_COUPON');
  });

  it('rejects an expired coupon', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'EXPIRED10',
      discountType: 'percentage',
      discountValue: 10,
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'EXPIRED10', orderTotal: 1000 })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_COUPON');
  });

  it('rejects order below minimum order value', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'MINORDER',
      discountType: 'flat',
      discountValue: 100,
      minOrderValue: 2000,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'MINORDER', orderTotal: 500 }) // below minimum
      .expect(400);

    expect(res.body.error.code).toBe('COUPON_MIN_ORDER');
  });

  it('computes percentage discount server-side correctly', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'SAVE20', orderTotal: 1000 })
      .expect(200);

    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(200); // 20% of 1000
    expect(res.body.finalAmount).toBe(800);
  });

  it('computes flat discount server-side correctly', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'FLAT100',
      discountType: 'flat',
      discountValue: 100,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'FLAT100', orderTotal: 1000 })
      .expect(200);

    expect(res.body.discount).toBe(100);
    expect(res.body.finalAmount).toBe(900);
  });

  it('caps percentage discount at maxDiscount', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'CAPPED50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 300, // max ₹300 off
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'CAPPED50', orderTotal: 2000 }) // 50% = 1000, but capped at 300
      .expect(200);

    expect(res.body.discount).toBe(300); // capped
    expect(res.body.finalAmount).toBe(1700);
  });

  it('rejects exhausted coupon usage limit', async () => {
    const adminId = await getAdminId();
    await Coupon.create({
      code: 'LIMITED1',
      discountType: 'flat',
      discountValue: 50,
      usageLimit: 1,
      usageCount: 1, // already used up
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      createdBy: adminId,
      isActive: true,
    });

    const token = await getBuyerToken();
    const res = await request(app)
      .post('/api/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'LIMITED1', orderTotal: 1000 })
      .expect(400);

    expect(res.body.error.code).toBe('COUPON_EXHAUSTED');
  });
});
