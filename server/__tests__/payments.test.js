/**
 * Payment verification tests
 * Tests: forged Razorpay signature rejected, valid signature accepted
 */

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

const TEST_DB = process.env.TEST_DB_URL || 'mongodb://localhost:27017/kalaghar_test';

let app, User, Order;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  User = require('../model/user');
  Order = require('../model/order');
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
  await Order.deleteMany({});
});

async function createBuyerAndLogin() {
  const hashed = await bcrypt.hash('Password123', 12);
  const email = `buyer_${Date.now()}@test.in`;
  const user = await User.create({ name: 'Buyer', email, password: hashed, role: 'buyer' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123' });
  return { user, token: res.body.token };
}

describe('POST /api/payments/razorpay/verify', () => {
  it('rejects a forged/invalid Razorpay signature', async () => {
    const { user, token } = await createBuyerAndLogin();

    // Create an order to reference
    const order = await Order.create({
      products: [],
      totalPrice: 1000,
      finalAmount: 1000,
      address: 'Test Address',
      userId: user._id.toString(),
      paymentMethod: 'razorpay',
      status: 'placed',
      orderedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: 'order_fake123',
        razorpay_payment_id: 'pay_fake456',
        razorpay_signature: 'this_is_a_forged_signature_that_will_not_match',
        orderId: order._id.toString(),
      })
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_SIGNATURE');

    // Verify the order was NOT marked as paid
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.paymentStatus).not.toBe('paid');
  });

  it('accepts a correctly computed Razorpay signature', async () => {
    const { user, token } = await createBuyerAndLogin();

    const order = await Order.create({
      products: [],
      totalPrice: 1000,
      finalAmount: 1000,
      address: 'Test Address',
      userId: user._id.toString(),
      paymentMethod: 'razorpay',
      status: 'placed',
      orderedAt: new Date(),
    });

    // Compute the correct signature using the test secret
    const razorpayOrderId = 'order_test_123';
    const razorpayPaymentId = 'pay_test_456';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: validSignature,
        orderId: order._id.toString(),
      })
      .expect(200);

    expect(res.body.order.paymentStatus).toBe('paid');
  });

  it('requires all signature fields', async () => {
    const { token } = await createBuyerAndLogin();
    const res = await request(app)
      .post('/api/payments/razorpay/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpay_order_id: 'order_123' }) // missing payment_id, signature, orderId
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
