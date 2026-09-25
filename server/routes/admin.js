const express = require('express');
const { body } = require('express-validator');
const User = require('../model/user');
const { Product } = require('../model/product');
const Order = require('../model/order');
const Return = require('../model/return');
const Coupon = require('../model/coupon');
const Notification = require('../model/notification');
const SupportTicket = require('../model/supportTicket');
const { requireRole } = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const adminRouter = express.Router();

// ─── GET /api/admin/summary — dashboard metrics ───────────────────────────────
adminRouter.get('/api/admin/summary', requireRole('admin'), async (req, res) => {
  try {
    const [
      totalCustomers,
      totalArtisans,
      totalOrders,
      pendingKyc,
      pendingProducts,
      returnsCount,
      orders,
    ] = await Promise.all([
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      Order.countDocuments(),
      User.countDocuments({ role: 'seller', kycStatus: 'pending' }),
      Product.countDocuments({ status: 'pending' }),
      Return.countDocuments({ status: 'requested' }),
      Order.find({ paymentStatus: 'paid' }).select('finalAmount commission createdAt'),
    ]);

    const revenue = orders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const commission = orders.reduce((sum, o) => sum + (o.commission || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvedToday = await Product.countDocuments({
      status: 'approved',
      updatedAt: { $gte: today },
    });

    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products.product._id', name: { $first: '$products.product.name' }, count: { $sum: '$products.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topArtisans = await Order.aggregate([
      { $unwind: '$products' },
      { $group: { _id: '$products.sellerId', count: { $sum: '$products.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', pipeline: [{ $project: { name: 1, storeName: 1 } }], foreignField: '_id', as: 'seller' } },
    ]);

    res.json({
      totalSales: revenue,
      orders: totalOrders,
      customers: totalCustomers,
      artisans: totalArtisans,
      revenue,
      commission,
      awaitingReview: pendingKyc + pendingProducts,
      approvedToday,
      returns: returnsCount,
      topProducts,
      topArtisans,
    });
  } catch (e) {
    logger.error('Admin summary error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch summary.' } });
  }
});

// ─── GET /api/admin/approvals ─────────────────────────────────────────────────
adminRouter.get('/api/admin/approvals', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, kind } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const approvals = [];

    if (!kind || kind === 'kyc') {
      const kycQueue = await User.find({ role: 'seller', kycStatus: 'pending' })
        .select('name storeName kycDocumentUrl kycStatus createdAt')
        .skip(skip).limit(parseInt(limit));

      kycQueue.forEach((u) => {
        approvals.push({
          id: u._id,
          name: u.storeName || u.name,
          kind: 'kyc',
          detail: `KYC verification for ${u.name}`,
          imageUrl: u.kycDocumentUrl,
          status: u.kycStatus,
          createdAt: u.createdAt,
        });
      });
    }

    if (!kind || kind === 'listing') {
      const listingQueue = await Product.find({ status: 'pending' })
        .skip(skip).limit(parseInt(limit));

      listingQueue.forEach((p) => {
        approvals.push({
          id: p._id,
          name: p.name,
          kind: 'listing',
          detail: `${p.craft} — ₹${p.price}`,
          imageUrl: p.images?.[0],
          status: p.status,
          createdAt: p.createdAt,
        });
      });
    }

    res.json(approvals);
  } catch (e) {
    logger.error('Admin approvals error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch approvals.' } });
  }
});

// ─── PATCH /api/admin/approvals/:id ──────────────────────────────────────────
adminRouter.patch(
  '/api/admin/approvals/:id',
  requireRole('admin'),
  [
    body('action').isIn(['approved', 'rejected']).withMessage('Action must be approved or rejected'),
    body('kind').isIn(['kyc', 'listing']).withMessage('Kind must be kyc or listing'),
  ],
  validate,
  async (req, res) => {
    try {
      const { action, kind } = req.body;

      if (kind === 'kyc') {
        const user = await User.findByIdAndUpdate(
          req.params.id,
          { kycStatus: action },
          { new: true }
        );
        if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });

        await Notification.create({
          userId: user._id,
          type: action === 'approved' ? 'kyc_approved' : 'kyc_rejected',
          title: action === 'approved' ? 'KYC Approved' : 'KYC Rejected',
          body: action === 'approved'
            ? 'Your KYC verification has been approved. You can now list products.'
            : 'Your KYC verification was rejected. Please re-submit with correct documents.',
          data: {},
        });

        return res.json({ id: user._id, kind: 'kyc', status: action });
      }

      if (kind === 'listing') {
        const product = await Product.findByIdAndUpdate(
          req.params.id,
          { status: action },
          { new: true }
        );
        if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });

        await Notification.create({
          userId: product.sellerId,
          type: action === 'approved' ? 'product_approved' : 'product_rejected',
          title: action === 'approved' ? 'Product Approved' : 'Product Rejected',
          body: `Your product "${product.name}" has been ${action}.`,
          data: { productId: product._id },
        });

        return res.json({ id: product._id, kind: 'listing', status: action });
      }
    } catch (e) {
      logger.error('Admin approval update error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update approval.' } });
    }
  }
);

// ─── Customers ────────────────────────────────────────────────────────────────
adminRouter.get('/api/admin/customers', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [customers, total] = await Promise.all([
      User.find({ role: 'buyer' }).select('-password -refreshToken').skip(skip).limit(parseInt(limit)),
      User.countDocuments({ role: 'buyer' }),
    ]);
    res.json({ customers, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Artisans ─────────────────────────────────────────────────────────────────
adminRouter.get('/api/admin/artisans', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, kycStatus } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { role: 'seller' };
    if (kycStatus) filter.kycStatus = kycStatus;

    const [artisans, total] = await Promise.all([
      User.find(filter).select('-password -refreshToken').skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ artisans, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Orders (admin) ───────────────────────────────────────────────────────────
adminRouter.get('/api/admin/orders', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = status ? { status } : {};

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// Legacy change order status
adminRouter.post('/admin/change-order-status', ...requireRole('admin'), async (req, res) => {
  try {
    const { status, id } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(order.status);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Returns / Disputes ───────────────────────────────────────────────────────
adminRouter.get('/api/admin/returns', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = status ? { status } : {};

    const [returns, total] = await Promise.all([
      Return.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Return.countDocuments(filter),
    ]);
    res.json({ returns, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

adminRouter.patch(
  '/api/returns/:id',
  requireRole('admin'),
  [body('status').isIn(['approved', 'rejected', 'refunded']).withMessage('Invalid status')],
  validate,
  async (req, res) => {
    try {
      const returnRecord = await Return.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status, adminNote: req.body.adminNote, resolvedAt: new Date() },
        { new: true }
      );
      if (!returnRecord) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Return not found.' } });
      }

      // Update order return status
      await Order.findByIdAndUpdate(returnRecord.orderId, { returnStatus: req.body.status, returnResolvedAt: new Date() });

      // Notify buyer
      const typeMap = {
        approved: 'return_approved',
        rejected: 'return_rejected',
        refunded: 'return_refunded',
      };
      await Notification.create({
        userId: returnRecord.userId,
        type: typeMap[req.body.status],
        title: `Return ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
        body: `Your return request has been ${req.body.status}.`,
        data: { returnId: returnRecord._id, orderId: returnRecord.orderId },
      });

      res.json(returnRecord);
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

// ─── Coupons (admin) ──────────────────────────────────────────────────────────
adminRouter.get('/api/admin/coupons', requireRole('admin'), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

adminRouter.post('/api/admin/coupons', requireRole('admin'), async (req, res) => {
  try {
    const coupon = new Coupon({ ...req.body, createdBy: req.user });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

adminRouter.patch('/api/admin/coupons/:id', requireRole('admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
adminRouter.delete('/api/admin/reviews/:productId/:reviewId', requireRole('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    product.ratings = product.ratings.filter((r) => r._id.toString() !== req.params.reviewId);
    await product.save();
    res.json({ message: 'Review removed.' });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Support tickets (admin view) ─────────────────────────────────────────────
adminRouter.get('/api/admin/support/tickets', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = status ? { status } : {};
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      SupportTicket.countDocuments(filter),
    ]);
    res.json({ tickets, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

adminRouter.patch('/api/admin/support/tickets/:id', requireRole('admin'), async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } });

    if (req.body.status) ticket.status = req.body.status;
    if (req.body.reply) {
      ticket.replies.push({ authorId: req.user, authorRole: 'admin', message: req.body.reply });
    }
    if (req.body.status === 'resolved') ticket.resolvedAt = new Date();
    await ticket.save();
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Legacy admin endpoints ───────────────────────────────────────────────────
adminRouter.get('/admin/get-orders', ...requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

adminRouter.get('/admin/analytics', ...requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({});
    let totalEarnings = 0;
    for (const order of orders) {
      for (const item of order.products) {
        totalEarnings += item.quantity * (item.product.price || 0);
      }
    }

    const craftKeys = ['pottery', 'textiles', 'paintings', 'jewellery', 'woodcraft'];
    const craftEarnings = {};
    for (const craft of craftKeys) {
      const craftOrders = await Order.find({ 'products.product.craft': craft });
      let e = 0;
      for (const o of craftOrders) {
        for (const item of o.products) {
          if (item.product.craft === craft) e += item.quantity * (item.product.price || 0);
        }
      }
      craftEarnings[`${craft}Earnings`] = e;
    }

    res.json({ totalEarnings, ...craftEarnings });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = adminRouter;
