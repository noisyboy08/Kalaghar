const express = require('express');
const { body } = require('express-validator');
const { requireRole, requireOwnership } = require('../middlewares/requireRole');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const User = require('../model/user');
const { Product } = require('../model/product');
const Order = require('../model/order');
const Coupon = require('../model/coupon');
const Notification = require('../model/notification');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const sellerRouter = express.Router();

// ─── KYC upload ───────────────────────────────────────────────────────────────
sellerRouter.post(
  '/api/sellers/:id/kyc',
  requireRole('seller'),
  requireOwnership(async (req) => req.params.id),
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: 'KYC document image is required.' },
        });
      }

      // Upload as PRIVATE (authenticated) Cloudinary asset — identity documents
      const { url, publicId } = await uploadToCloudinary(
        req.file.buffer,
        'kalaghar/kyc',
        true // isPrivate = true
      );

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          kycStatus: 'pending',
          kycDocumentUrl: url,
          kycDocumentPublicId: publicId,
        },
        { new: true }
      ).select('-password -refreshToken');

      await Notification.create({
        userId: user._id,
        type: 'kyc_submitted',
        title: 'KYC Submitted',
        body: 'Your KYC documents have been submitted and are under review.',
        data: {},
      });

      logger.info('KYC submitted', { userId: user._id });
      res.json({ kycStatus: user.kycStatus, message: 'KYC documents submitted for review.' });
    } catch (e) {
      logger.error('KYC upload error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to submit KYC.' } });
    }
  }
);

// ─── Public artisan page ──────────────────────────────────────────────────────
sellerRouter.get('/api/sellers/:id', async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' })
      .select('name storeName craft region technique artisanStory kycStatus createdAt');

    if (!seller) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Artisan not found.' } });
    }

    const productCount = await Product.countDocuments({ sellerId: req.params.id, status: 'approved' });
    const avgRating = await Product.aggregate([
      { $match: { sellerId: seller._id, status: 'approved' } },
      { $unwind: '$ratings' },
      { $group: { _id: null, avg: { $avg: '$ratings.rating' } } },
    ]);

    res.json({
      ...seller.toObject(),
      id: seller._id,
      productCount,
      averageRating: avgRating[0]?.avg || 0,
    });
  } catch (e) {
    logger.error('Get seller error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch artisan.' } });
  }
});

// ─── Update artisan story ─────────────────────────────────────────────────────
sellerRouter.put(
  '/api/sellers/:id/story',
  requireRole('seller'),
  requireOwnership(async (req) => req.params.id),
  async (req, res) => {
    try {
      const { village, region, yearsOfExperience, technique, bio } = req.body;
      const seller = await User.findByIdAndUpdate(
        req.params.id,
        { artisanStory: { village, region, yearsOfExperience, technique, bio } },
        { new: true }
      ).select('-password -refreshToken');
      res.json(seller);
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

// ─── Seller products ──────────────────────────────────────────────────────────
sellerRouter.get(
  '/api/sellers/:id/products',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => req.params.id),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = { sellerId: req.params.id };
      if (status) filter.status = status;

      const [products, total] = await Promise.all([
        Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Product.countDocuments(filter),
      ]);
      res.json({ products, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

// ─── Seller orders ────────────────────────────────────────────────────────────
sellerRouter.get(
  '/api/sellers/:id/orders',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => req.params.id),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = { 'products.sellerId': req.params.id };
      if (status) filter.status = status;

      const [orders, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Order.countDocuments(filter),
      ]);
      res.json({ orders, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

// ─── Seller order status update ───────────────────────────────────────────────
sellerRouter.patch(
  '/api/sellers/:id/orders/:orderId/status',
  requireRole('seller'),
  requireOwnership(async (req) => req.params.id),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        'products.sellerId': req.params.id,
      });

      if (!order) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
      }

      const validNext = Order.statics?.VALID_TRANSITIONS?.[order.status] ||
        { placed: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['out_for_delivery'], out_for_delivery: ['delivered'], delivered: [], cancelled: [] }[order.status];

      if (!validNext || !validNext.includes(req.body.status)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_TRANSITION',
            message: `Cannot transition order from '${order.status}' to '${req.body.status}'.`,
          },
        });
      }

      order.status = req.body.status;
      order.statusTimeline.push({ status: req.body.status, timestamp: new Date() });
      await order.save();

      // Notify buyer
      const typeMap = {
        confirmed: 'order_confirmed',
        shipped: 'order_shipped',
        out_for_delivery: 'order_out_for_delivery',
        delivered: 'order_delivered',
        cancelled: 'order_cancelled',
      };
      const titleMap = {
        confirmed: 'Order Confirmed',
        shipped: 'Order Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Order Delivered',
        cancelled: 'Order Cancelled',
      };
      if (typeMap[req.body.status]) {
        await Notification.create({
          userId: order.userId,
          type: typeMap[req.body.status],
          title: titleMap[req.body.status],
          body: `Your order #${order._id.toString().slice(-8).toUpperCase()} is now ${req.body.status.replace('_', ' ')}.`,
          data: { orderId: order._id },
        });
      }

      logger.info('Seller updated order status', { orderId: order._id, status: req.body.status });
      res.json(order);
    } catch (e) {
      logger.error('Seller order status error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update order status.' } });
    }
  }
);

// ─── Seller earnings ──────────────────────────────────────────────────────────
sellerRouter.get(
  '/api/sellers/:id/earnings',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => req.params.id),
  async (req, res) => {
    try {
      const sellerId = req.params.id;

      const orders = await Order.find({
        'products.sellerId': sellerId,
        paymentStatus: 'paid',
      }).select('products finalAmount commission createdAt');

      let totalRevenue = 0;
      let totalCommission = 0;
      const byMonth = {};
      const byCraft = {};

      for (const order of orders) {
        for (const item of order.products) {
          if (item.sellerId === sellerId) {
            const itemRevenue = item.product.price * item.quantity;
            totalRevenue += itemRevenue;
            totalCommission += (itemRevenue * (order.commissionRate || 10)) / 100;

            const month = new Date(order.createdAt).toISOString().slice(0, 7);
            byMonth[month] = (byMonth[month] || 0) + itemRevenue;

            const craft = item.product.craft || 'other';
            byCraft[craft] = (byCraft[craft] || 0) + itemRevenue;
          }
        }
      }

      res.json({
        totalRevenue,
        totalCommission,
        netEarnings: totalRevenue - totalCommission,
        byMonth,
        byCraft,
      });
    } catch (e) {
      logger.error('Seller earnings error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch earnings.' } });
    }
  }
);

// ─── Seller reviews ───────────────────────────────────────────────────────────
sellerRouter.get(
  '/api/sellers/:id/reviews',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => req.params.id),
  async (req, res) => {
    try {
      const products = await Product.find({ sellerId: req.params.id }).select('name ratings');
      const reviews = [];
      for (const product of products) {
        for (const rating of product.ratings) {
          reviews.push({ productId: product._id, productName: product.name, ...rating.toObject() });
        }
      }
      res.json(reviews);
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

// ─── Seller coupons ───────────────────────────────────────────────────────────
sellerRouter.post(
  '/api/sellers/:id/coupons',
  requireRole('seller'),
  requireOwnership(async (req) => req.params.id),
  [
    body('code').trim().notEmpty().withMessage('Coupon code is required'),
    body('discountType').isIn(['percentage', 'flat']).withMessage('Discount type must be percentage or flat'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
    body('expiresAt').isISO8601().withMessage('Valid expiry date is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const coupon = new Coupon({
        ...req.body,
        sellerId: req.params.id,
        createdBy: req.user,
      });
      await coupon.save();
      res.status(201).json(coupon);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(400).json({ error: { code: 'DUPLICATE_CODE', message: 'This coupon code already exists.' } });
      }
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

module.exports = sellerRouter;
