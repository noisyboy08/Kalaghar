const express = require('express');
const { body, param } = require('express-validator');
const User = require('../model/user');
const Order = require('../model/order');
const { Product } = require('../model/product');
const Coupon = require('../model/coupon');
const Return = require('../model/return');
const Notification = require('../model/notification');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const userRouter = express.Router();

// ─── Helper: send notification ────────────────────────────────────────────────
async function createNotification(userId, type, title, body, data = {}) {
  try {
    await Notification.create({ userId, type, title, body, data });
  } catch (e) {
    logger.warn('Failed to create notification', { error: e.message });
  }
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
userRouter.get('/api/get-cart', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.json(user.cart);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post('/api/add-to-cart', auth, async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not available.' } });
    }

    let user = await User.findById(req.user);
    const existingItem = user.cart.find((item) => item.product._id.toString() === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({ product, quantity: 1 });
    }

    user = await user.save();
    res.json(user.cart);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.delete('/api/remove-from-cart/:id', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user);
    const item = user.cart.find((i) => i.product._id.toString() === req.params.id);
    if (item) {
      if (item.quantity <= 1) {
        user.cart = user.cart.filter((i) => i.product._id.toString() !== req.params.id);
      } else {
        item.quantity -= 1;
      }
    }
    user = await user.save();
    res.json(user.cart);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.delete('/api/delete-from-cart/:id', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user);
    user.cart = user.cart.filter((i) => i.product._id.toString() !== req.params.id);
    user = await user.save();
    res.json(user.cart);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Address Book ─────────────────────────────────────────────────────────────
userRouter.get('/api/addresses', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('addresses');
    res.json(user.addresses);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post(
  '/api/addresses',
  auth,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('pincode').trim().isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user);
      const address = req.body;

      if (address.isDefault || user.addresses.length === 0) {
        user.addresses.forEach((a) => { a.isDefault = false; });
        address.isDefault = true;
      }

      user.addresses.push(address);
      await user.save();
      res.status(201).json(user.addresses);
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
    }
  }
);

userRouter.put('/api/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Address not found.' } });
    }

    Object.assign(address, req.body);

    if (req.body.isDefault) {
      user.addresses.forEach((a) => {
        if (a._id.toString() !== req.params.addressId) a.isDefault = false;
      });
    }

    await user.save();
    res.json(user.addresses);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.delete('/api/addresses/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// Legacy address endpoint
userRouter.post('/api/save-user-address', auth, async (req, res) => {
  try {
    const { address } = req.body;
    let user = await User.findById(req.user);
    user.address = address;
    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────
userRouter.post(
  '/api/order',
  auth,
  [
    body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('address').notEmpty().withMessage('Delivery address is required'),
    body('paymentMethod').isIn(['razorpay', 'cod']).withMessage('Payment method must be razorpay or cod'),
  ],
  validate,
  async (req, res) => {
    try {
      const { totalPrice, address, paymentMethod, couponCode, addressId } = req.body;
      let user = await User.findById(req.user);
      const userCart = user.cart;

      if (!userCart || userCart.length === 0) {
        return res.status(400).json({ error: { code: 'EMPTY_CART', message: 'Cart is empty.' } });
      }

      // Validate and deduct stock
      const products = [];
      for (let i = 0; i < userCart.length; i++) {
        const product = await Product.findById(userCart[i].product._id);
        if (!product || product.status !== 'approved') {
          return res.status(400).json({
            error: { code: 'PRODUCT_UNAVAILABLE', message: `${userCart[i].product.name} is no longer available.` },
          });
        }
        if (product.stock < userCart[i].quantity) {
          return res.status(400).json({
            error: { code: 'OUT_OF_STOCK', message: `${product.name} only has ${product.stock} in stock.` },
          });
        }
        product.stock -= userCart[i].quantity;
        product.quantity -= userCart[i].quantity;
        await product.save();
        products.push({ product, quantity: userCart[i].quantity, sellerId: product.sellerId?.toString() });
      }

      // Validate coupon server-side
      let discount = 0;
      let appliedCoupon = null;
      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { $gt: new Date() },
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
          ],
        });

        if (!coupon) {
          return res.status(400).json({ error: { code: 'INVALID_COUPON', message: 'Coupon is invalid or expired.' } });
        }
        if (totalPrice < coupon.minOrderValue) {
          return res.status(400).json({
            error: { code: 'COUPON_MIN_ORDER', message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}.` },
          });
        }

        if (coupon.discountType === 'percentage') {
          discount = (totalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }

        coupon.usageCount += 1;
        await coupon.save();
        appliedCoupon = coupon.code;
      }

      const finalAmount = Math.max(0, totalPrice - discount);

      // Commission (computed server-side, default 10%)
      const commissionRate = user.commissionRate || 10;
      const commission = (finalAmount * commissionRate) / 100;

      // Clear cart
      user.cart = [];
      await user.save();

      let order = new Order({
        products,
        totalPrice,
        discount,
        couponCode: appliedCoupon,
        finalAmount,
        commission,
        commissionRate,
        address: addressId || address,
        userId: req.user,
        paymentMethod,
        status: 'placed',
        statusTimeline: [{ status: 'placed', timestamp: new Date() }],
        orderedAt: new Date(),
        // COD orders are immediately pending payment status; Razorpay needs webhook
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      });

      order = await order.save();

      await createNotification(
        req.user,
        'order_placed',
        'Order Placed',
        `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed successfully.`,
        { orderId: order._id }
      );

      logger.info('Order created', { orderId: order._id, userId: req.user, paymentMethod });
      res.status(201).json(order);
    } catch (e) {
      logger.error('Order error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to place order.' } });
    }
  }
);

// ─── GET /api/orders/me — paginated buyer orders ──────────────────────────────
userRouter.get('/api/orders/me', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// Legacy get all orders
userRouter.get('/api/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.get('/api/orders/search/:name', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      'products.product.name': { $regex: req.params.name, $options: 'i' },
      userId: req.user,
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── POST /api/orders/:id/return — buyer requests return ──────────────────────
userRouter.post(
  '/api/orders/:id/return',
  auth,
  [body('reason').trim().notEmpty().withMessage('Return reason is required')],
  validate,
  async (req, res) => {
    try {
      const order = await Order.findOne({ _id: req.params.id, userId: req.user });
      if (!order) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
      }
      if (order.status !== 'delivered') {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: 'Returns can only be requested for delivered orders.' },
        });
      }
      if (order.returnStatus !== 'none') {
        return res.status(400).json({
          error: { code: 'RETURN_EXISTS', message: 'A return request already exists for this order.' },
        });
      }

      // Check within return window (7 days)
      const deliveredAt = order.statusTimeline.find((s) => s.status === 'delivered')?.timestamp;
      if (deliveredAt) {
        const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivery > 7) {
          return res.status(400).json({
            error: { code: 'RETURN_WINDOW_EXPIRED', message: 'Return window (7 days) has expired.' },
          });
        }
      }

      order.returnStatus = 'requested';
      order.returnReason = req.body.reason;
      order.returnRequestedAt = new Date();
      await order.save();

      await Return.create({
        orderId: order._id,
        userId: req.user,
        reason: req.body.reason,
        status: 'requested',
      });

      await createNotification(req.user, 'return_requested', 'Return Requested',
        'Your return request has been submitted and is under review.', { orderId: order._id });

      res.status(201).json({ message: 'Return request submitted.', returnStatus: order.returnStatus });
    } catch (e) {
      logger.error('Return request error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to submit return request.' } });
    }
  }
);

// ─── Place order buy now (legacy) ─────────────────────────────────────────────
userRouter.post('/api/place-order-buy-now', auth, async (req, res) => {
  try {
    const { id, totalPrice, address } = req.body;
    const product = await Product.findById(id);
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not available.' } });
    }

    const products = [{ product, quantity: 1, sellerId: product.sellerId?.toString() }];
    const commission = (totalPrice * 10) / 100;

    let order = new Order({
      products,
      totalPrice,
      finalAmount: totalPrice,
      commission,
      commissionRate: 10,
      address,
      userId: req.user,
      paymentMethod: 'cod',
      status: 'placed',
      statusTimeline: [{ status: 'placed', timestamp: new Date() }],
      orderedAt: new Date(),
    });

    order = await order.save();
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Save for later / Move to cart / Keep shopping for ───────────────────────
userRouter.get('/api/get-save-for-later', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.json(user.saveForLater);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post('/api/save-for-later', auth, async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    if (!user.saveForLater.some((i) => i.product._id.toString() === id)) {
      user.saveForLater.push({ product });
    }
    user.cart = user.cart.filter((i) => i.product._id.toString() !== id);
    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.delete('/api/delete-from-later/:id', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user);
    user.saveForLater = user.saveForLater.filter((i) => i.product._id.toString() !== req.params.id);
    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post('/api/move-to-cart', auth, async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    user.saveForLater = user.saveForLater.filter((i) => i.product._id.toString() !== id);

    const existing = user.cart.find((i) => i.product._id.toString() === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      user.cart.push({ product, quantity: 1 });
    }

    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.get('/api/add-keep-shopping-for/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    user.keepShoppingFor = user.keepShoppingFor.filter((i) => i.product._id.toString() !== id);
    user.keepShoppingFor.push({ product });
    user = await user.save();
    res.json(user.keepShoppingFor);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.get('/api/get-keep-shopping-for', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.json(user.keepShoppingFor.map((i) => i.product));
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────
userRouter.get('/api/get-wish-list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.json(user.wishList.map((i) => i.product));
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post('/api/add-to-wish-list', auth, async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    if (!user.wishList.some((i) => i.product._id.toString() === id)) {
      user.wishList.push({ product });
    }
    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.delete('/api/delete-from-wish-list/:id', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user);
    user.wishList = user.wishList.filter((i) => i.product._id.toString() !== req.params.id);
    user = await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.get('/api/is-wishlisted/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const isFound = user.wishList.some((i) => i.product._id.toString() === req.params.id);
    res.json(isFound);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

userRouter.post('/api/add-to-cart-from-wish-list', auth, async (req, res) => {
  try {
    const { id } = req.body;
    const product = await Product.findById(id);
    let user = await User.findById(req.user);

    user.wishList = user.wishList.filter((i) => i.product._id.toString() !== id);

    const existing = user.cart.find((i) => i.product._id.toString() === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      user.cart.push({ product, quantity: 1 });
    }

    user = await user.save();
    res.json(user.wishList.map((i) => i.product));
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── FCM token update ─────────────────────────────────────────────────────────
userRouter.post('/api/fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user, { fcmToken });
    res.json({ message: 'FCM token updated.' });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = userRouter;