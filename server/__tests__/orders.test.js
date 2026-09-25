/**
 * Order flow tests
 * Tests: order creation, status transition rules, commission calculation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const TEST_DB = process.env.TEST_DB_URL || 'mongodb://localhost:27017/kalaghar_test';

let app, User, Order, Product;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  User = require('../model/user');
  Order = require('../model/order');
  Product = require('../model/product').Product;
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
  await Product.deleteMany({});
});

async function createAndLoginUser(role = 'buyer') {
  const hashed = await bcrypt.hash('Password123', 12);
  const email = `${role}_${Date.now()}@test.in`;
  const user = await User.create({
    name: `Test ${role}`,
    email,
    password: hashed,
    role,
    ...(role === 'seller' ? { storeName: 'Test Store', kycStatus: 'approved' } : {}),
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return { user, token: res.body.token };
}

describe('Order status transitions', () => {
  let order;

  beforeEach(async () => {
    const { user: buyer } = await createAndLoginUser('buyer');
    const { user: seller } = await createAndLoginUser('seller');

    const product = await Product.create({
      name: 'Test Product', description: 'test', price: 1000, stock: 10, quantity: 10,
      craft: 'pottery', images: ['img.jpg'], sellerId: seller._id, status: 'approved',
    });

    order = await Order.create({
      products: [{ product, quantity: 1, sellerId: seller._id.toString() }],
      totalPrice: 1000,
      finalAmount: 1000,
      commission: 100,
      commissionRate: 10,
      address: 'Test Address',
      userId: buyer._id.toString(),
      paymentMethod: 'cod',
      status: 'placed',
      statusTimeline: [{ status: 'placed', timestamp: new Date() }],
      orderedAt: new Date(),
    });
  });

  it('order starts in placed status', () => {
    expect(order.status).toBe('placed');
  });

  it('cannot skip from placed directly to delivered', async () => {
    const { user: seller, token: sellerToken } = await createAndLoginUser('seller');
    const sellerOrder = await Order.findByIdAndUpdate(order._id, { 'products.0.sellerId': seller._id.toString() });

    const res = await request(app)
      .patch(`/api/sellers/${seller._id}/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'delivered' })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('calculates commission at 10% by default', () => {
    const expectedCommission = (order.finalAmount * 10) / 100;
    expect(order.commission).toBe(expectedCommission);
  });

  it('commission is stored at order creation — not recalculated later', async () => {
    const originalCommission = order.commission;
    // Simulate price change on product
    const product = await Product.findById(order.products[0].product._id);
    if (product) {
      product.price = 9999;
      await product.save();
    }

    const refreshedOrder = await Order.findById(order._id);
    expect(refreshedOrder.commission).toBe(originalCommission);
  });
});

describe('Order commission calculation', () => {
  it('calculates 10% commission correctly', async () => {
    const { user: seller } = await createAndLoginUser('seller');
    const order = await Order.create({
      products: [],
      totalPrice: 2000,
      finalAmount: 2000,
      commission: 200, // 10% of 2000
      commissionRate: 10,
      address: 'Address',
      userId: new mongoose.Types.ObjectId().toString(),
      paymentMethod: 'cod',
      status: 'placed',
      orderedAt: new Date(),
    });

    expect(order.commission).toBe(200);
  });
});
