const jwt = require('jsonwebtoken');
const User = require('../model/user');
const logger = require('../config/logger');

/**
 * Core auth middleware.
 * Verifies the JWT access token from the Authorization header (Bearer scheme).
 * Attaches req.user (id string) and req.userRole to the request.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.header('x-auth-token'); // backward compat

    if (!token) {
      return res.status(401).json({
        error: { code: 'NO_TOKEN', message: 'No auth token, access denied.' },
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: { code: 'TOKEN_EXPIRED', message: 'Access token expired. Please refresh.' },
        });
      }
      return res.status(401).json({
        error: { code: 'TOKEN_INVALID', message: 'Token verification failed, access denied.' },
      });
    }

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    req.user = decoded.id;
    req.userRole = user.role;
    req.token = token;

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
    });
  }
};

/**
 * Optional auth middleware.
 * Attaches req.user and req.userRole if a valid token is present, but does not block unauthenticated requests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.header('x-auth-token');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        if (user) {
          req.user = decoded.id;
          req.userRole = user.role;
          req.token = token;
        }
      } catch (err) {
        // Ignore invalid token for optional auth
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;