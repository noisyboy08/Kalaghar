const express = require('express');
const { body } = require('express-validator');
const Coupon = require('../model/coupon');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const couponsRouter = express.Router();

// ─── POST /api/coupons/validate ───────────────────────────────────────────────
couponsRouter.post(
  '/api/coupons/validate',
  auth,
  [
    body('code').trim().notEmpty().withMessage('Coupon code is required'),
    body('orderTotal').isFloat({ min: 0 }).withMessage('Order total is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { code, orderTotal, craft } = req.body;

      const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!coupon) {
        return res.status(400).json({
          error: { code: 'INVALID_COUPON', message: 'Coupon code is invalid or has expired.' },
        });
      }

      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({
          error: { code: 'COUPON_EXHAUSTED', message: 'This coupon has reached its usage limit.' },
        });
      }

      if (orderTotal < coupon.minOrderValue) {
        return res.status(400).json({
          error: {
            code: 'COUPON_MIN_ORDER',
            message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
          },
        });
      }

      if (coupon.applicableCrafts?.length > 0 && craft && !coupon.applicableCrafts.includes(craft)) {
        return res.status(400).json({
          error: {
            code: 'COUPON_NOT_APPLICABLE',
            message: `This coupon is not applicable to ${craft} products.`,
          },
        });
      }

      // Compute discount server-side
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (orderTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }

      discount = Math.min(discount, orderTotal); // can't discount more than order total
      discount = Math.round(discount * 100) / 100;

      logger.info('Coupon validated', { code: coupon.code, discount });

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discount,
        finalAmount: Math.max(0, orderTotal - discount),
      });
    } catch (e) {
      logger.error('Coupon validation error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to validate coupon.' } });
    }
  }
);

module.exports = couponsRouter;
