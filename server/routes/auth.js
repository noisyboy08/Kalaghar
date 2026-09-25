const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../model/user');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginLimiter, registerLimiter, adminLoginLimiter } = require('../middlewares/rateLimiter');
const logger = require('../config/logger');
const Notification = require('../model/notification');

const authRouter = express.Router();

// ─── Token helpers ────────────────────────────────────────────────────────────
function generateAccessToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
authRouter.post(
  '/api/auth/register',
  registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .isIn(['buyer', 'seller'])
      .withMessage('Role must be buyer or seller'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role, storeName, craft, region, technique, phone } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || 'buyer',
      };

      if (role === 'seller') {
        if (!storeName) {
          return res.status(422).json({
            error: { code: 'VALIDATION_ERROR', message: 'Store name is required for sellers.' },
          });
        }
        userData.storeName = storeName;
        if (craft) userData.craft = craft;
        if (region) userData.region = region;
        if (technique) userData.technique = technique;
        if (phone) userData.phone = phone;
        userData.kycStatus = 'none';
      }

      let user = new User(userData);
      user = await user.save();

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      const { password: _, refreshToken: __, ...userDoc } = user._doc || user.toObject();

      logger.info('User registered', { userId: user._id, role: user.role });

      res.status(201).json({
        token: accessToken,
        refreshToken,
        user: { ...userDoc, id: user._id },
      });
    } catch (e) {
      logger.error('Register error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Registration failed.' } });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
authRouter.post(
  '/api/auth/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
        });
      }

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      const { password: _, refreshToken: __, ...userDoc } = user.toObject();

      logger.info('User logged in', { userId: user._id, role: user.role });

      res.json({
        token: accessToken,
        refreshToken,
        user: { ...userDoc, id: user._id },
      });
    } catch (e) {
      logger.error('Login error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Login failed.' } });
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
authRouter.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({
        error: { code: 'NO_TOKEN', message: 'Refresh token required.' },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired refresh token.' },
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        error: { code: 'TOKEN_INVALID', message: 'Refresh token does not match.' },
      });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (e) {
    logger.error('Token refresh error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Token refresh failed.' } });
  }
});

// ─── POST /api/admin/login ────────────────────────────────────────────────────
authRouter.post(
  '/api/admin/login',
  adminLoginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, role: 'admin' });
      if (!user) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials.' },
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials.' },
        });
      }

      const accessToken = generateAccessToken(user._id, 'admin');
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      await user.save();

      logger.info('Admin logged in', { userId: user._id });

      res.json({
        token: accessToken,
        refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: 'admin' },
      });
    } catch (e) {
      logger.error('Admin login error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Admin login failed.' } });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
authRouter.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
    }
    res.json({ user: { ...user.toObject(), id: user._id }, token: req.token });
  } catch (e) {
    logger.error('Auth me error', { error: e.message });
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch user.' } });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
authRouter.post('/api/auth/logout', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user, { refreshToken: null });
    res.json({ message: 'Logged out successfully.' });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Logout failed.' } });
  }
});

// ─── Legacy routes (backward compat) ─────────────────────────────────────────
authRouter.post('/api/signup', registerLimiter, async (req, res) => {
  req.url = '/api/auth/register';
  res.redirect(307, '/api/auth/register');
});

authRouter.post('/api/signin', loginLimiter, async (req, res) => {
  req.url = '/api/auth/login';
  res.redirect(307, '/api/auth/login');
});

authRouter.get('/IsTokenValid', async (req, res) => {
  try {
    const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
    if (!token) return res.json(false);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    return res.json(!!user);
  } catch (e) {
    return res.json(false);
  }
});

authRouter.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kalaghar API — Multi-Vendor Indian Artisan Marketplace',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      login: '/api/auth/login',
      register: '/api/auth/register',
    },
  });
});

module.exports = authRouter;
