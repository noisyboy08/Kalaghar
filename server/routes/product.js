const express = require('express');
const { body, query, param } = require('express-validator');
const { Product, VALID_CRAFTS } = require('../model/product');
const Rating = require('../model/rating');
const Order = require('../model/order');
const { auth, optionalAuth } = require('../middlewares/auth');
const { requireRole, requireOwnership } = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const Notification = require('../model/notification');

const productRouter = express.Router();

// ─── Helper: consistent error ─────────────────────────────────────────────────
const err = (code, message, status = 400) => ({ error: { code, message }, status });

// ─── GET /api/products — paginated, filterable ────────────────────────────────
productRouter.get('/api/products', optionalAuth, async (req, res) => {
  try {
    const {
      craft, region, status, minPrice, maxPrice, sort, page = 1, limit = 20,
    } = req.query;

    const filter = {};

    // Buyers and unauthenticated visitors only see approved products
    if (req.userRole === 'buyer' || !req.userRole) {
      filter.status = 'approved';
    } else if (status) {
      filter.status = status;
    }

    if (craft) filter.craft = craft;
    if (region) filter.region = new RegExp(region, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating: { 'ratings.length': -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (e) {
    logger.error('Get products error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch products.' } });
  }
});

// ─── GET /api/products/search/:name — full-text search ───────────────────────
productRouter.get('/api/products/search/:name', optionalAuth, async (req, res) => {
  try {
    const { name } = req.params;
    const { craft, page = 1, limit = 20 } = req.query;

    const filter = {
      $text: { $search: name },
      ...(req.userRole === 'buyer' || !req.userRole ? { status: 'approved' } : {}),
      ...(craft ? { craft } : {}),
    };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (e) {
    logger.error('Product search error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Search failed.' } });
  }
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
productRouter.get('/api/products/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    // Buyers cannot see non-approved products
    if (req.userRole === 'buyer' && product.status !== 'approved') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    res.json(product);
  } catch (e) {
    logger.error('Get product error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch product.' } });
  }
});

// ─── POST /api/products — seller creates a product ───────────────────────────
productRouter.post(
  '/api/products',
  requireRole('seller'),
  upload.array('images', 10),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 1 }).withMessage('Price must be greater than 0'),
    body('stock').isInt({ min: 0 }).withMessage('Stock cannot be negative'),
    body('craft').isIn(VALID_CRAFTS).withMessage(`Craft must be one of: ${VALID_CRAFTS.join(', ')}`),
  ],
  validate,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: 'At least one product image is required.' },
        });
      }

      // Upload images to Cloudinary
      const imageUrls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, 'kalaghar/products'))
      );

      const product = new Product({
        name: req.body.name,
        description: req.body.description,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock),
        quantity: parseInt(req.body.stock),
        craft: req.body.craft,
        category: req.body.craft, // backward compat
        region: req.body.region,
        technique: req.body.technique,
        images: imageUrls.map((r) => r.url),
        sellerId: req.user,
        status: 'pending', // always starts pending
      });

      await product.save();
      logger.info('Product created', { productId: product._id, sellerId: req.user });
      res.status(201).json(product);
    } catch (e) {
      logger.error('Create product error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create product.' } });
    }
  }
);

// ─── PUT /api/products/:id — seller edits their own product ──────────────────
productRouter.put(
  '/api/products/:id',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.sellerId : null;
  }),
  [
    body('price').optional().isFloat({ min: 1 }).withMessage('Price must be greater than 0'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock cannot be negative'),
    body('craft').optional().isIn(VALID_CRAFTS).withMessage(`Craft must be one of: ${VALID_CRAFTS.join(', ')}`),
  ],
  validate,
  async (req, res) => {
    try {
      const allowedFields = ['name', 'description', 'price', 'stock', 'craft', 'region', 'technique'];
      const updates = {};
      allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
      });
      if (updates.craft) updates.category = updates.craft;
      if (updates.stock !== undefined) updates.quantity = updates.stock;

      // Re-set to pending if seller edits (admin keeps current status)
      if (req.userRole === 'seller') {
        updates.status = 'pending';
      }

      const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!product) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
      }

      res.json(product);
    } catch (e) {
      logger.error('Update product error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update product.' } });
    }
  }
);

// ─── PATCH /api/products/:id/status — admin only ─────────────────────────────
productRouter.patch(
  '/api/products/:id/status',
  requireRole('admin'),
  [body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')],
  validate,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!product) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
      }

      // Notify seller
      await Notification.create({
        userId: product.sellerId,
        type: req.body.status === 'approved' ? 'product_approved' : 'product_rejected',
        title: req.body.status === 'approved' ? 'Product Approved' : 'Product Rejected',
        body: `Your product "${product.name}" has been ${req.body.status}.`,
        data: { productId: product._id },
      });

      logger.info('Product status updated', { productId: product._id, status: req.body.status });
      res.json(product);
    } catch (e) {
      logger.error('Update product status error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update status.' } });
    }
  }
);

// ─── DELETE /api/products/:id — seller or admin ───────────────────────────────
productRouter.delete(
  '/api/products/:id',
  requireRole('seller', 'admin'),
  requireOwnership(async (req) => {
    const product = await Product.findById(req.params.id);
    return product ? product.sellerId : null;
  }),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
      }
      res.json({ message: 'Product deleted.' });
    } catch (e) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete product.' } });
    }
  }
);

// ─── POST /api/rate-product ───────────────────────────────────────────────────
productRouter.post('/api/rate-product', auth, async (req, res) => {
  try {
    const { id, rating, review } = req.body;

    // Restrict to buyers who have a delivered order for this product
    const delivered = await Order.findOne({
      userId: req.user,
      status: 'delivered',
      'products.product._id': id,
    });

    if (!delivered) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only review products from delivered orders.',
        },
      });
    }

    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    // Replace existing rating by this user
    product.ratings = product.ratings.filter((r) => r.userId.toString() !== req.user.toString());
    product.ratings.push({ userId: req.user, rating, review });
    product = await product.save();

    res.json(product);
  } catch (e) {
    logger.error('Rate product error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to rate product.' } });
  }
});

// ─── GET /api/get-product-rating/:id ─────────────────────────────────────────
productRouter.get('/api/get-product-rating/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });

    const myRating = product.ratings.find((r) => r.userId.toString() === req.user.toString());
    res.json(myRating ? myRating.rating : -1.0);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── GET /api/get-ratings-average/:id ────────────────────────────────────────
productRouter.get('/api/get-ratings-average/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });

    if (product.ratings.length === 0) return res.json(0);
    const avg = product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length;
    res.json(Math.round(avg * 10) / 10);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── GET /api/get-average-ratings-length/:id ─────────────────────────────────
productRouter.get('/api/get-average-ratings-length/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    res.json(product.ratings.length);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── GET /api/deal-of-the-day ─────────────────────────────────────────────────
productRouter.get('/api/deal-of-the-day', auth, async (req, res) => {
  try {
    const products = await Product.find({ status: 'approved' }).sort({ 'ratings.length': -1 }).limit(1);
    if (!products.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No products available.' } });
    }
    res.json(products[0]);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = productRouter;
