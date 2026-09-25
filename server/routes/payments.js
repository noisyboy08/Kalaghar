const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { body } = require('express-validator');
const auth = require('../middlewares/auth');
const Order = require('../model/order');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const paymentsRouter = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/payments/razorpay/order ───────────────────────────────────────
// Server creates the Razorpay order before the client opens checkout
paymentsRouter.post(
  '/api/payments/razorpay/order',
  auth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('currency').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { amount, currency = 'INR', orderId } = req.body;

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency,
        receipt: orderId || `kalaghar_${Date.now()}`,
        notes: { userId: req.user },
      });

      logger.info('Razorpay order created', { razorpayOrderId: razorpayOrder.id, userId: req.user });

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e) {
      logger.error('Razorpay order creation error', { error: e.message });
      res.status(500).json({ error: { code: 'PAYMENT_ERROR', message: 'Failed to create payment order.' } });
    }
  }
);

// ─── POST /api/payments/razorpay/verify ──────────────────────────────────────
// Server verifies the payment signature — NEVER trust client-side success callback alone
paymentsRouter.post(
  '/api/payments/razorpay/verify',
  auth,
  [
    body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
    body('orderId').notEmpty().withMessage('Kalaghar order ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      // HMAC-SHA256 verification
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        logger.warn('Razorpay signature mismatch', {
          userId: req.user,
          razorpay_order_id,
          razorpay_payment_id,
        });
        return res.status(400).json({
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Payment verification failed. Signature mismatch.',
          },
        });
      }

      // Signature valid — mark order as paid
      const order = await Order.findOneAndUpdate(
        { _id: orderId, userId: req.user },
        {
          paymentStatus: 'paid',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
      }

      logger.info('Payment verified', { orderId, razorpay_payment_id, userId: req.user });
      res.json({ message: 'Payment verified successfully.', order });
    } catch (e) {
      logger.error('Razorpay verification error', { error: e.message });
      res.status(500).json({ error: { code: 'PAYMENT_ERROR', message: 'Payment verification failed.' } });
    }
  }
);

module.exports = paymentsRouter;
