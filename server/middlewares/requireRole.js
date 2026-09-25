const auth = require('./auth');
const User = require('../model/user');
const logger = require('../config/logger');

/**
 * Role-based access control middleware factory.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'seller', 'buyer')
 */
const requireRole = (...roles) => {
  return [
    auth,
    (req, res, next) => {
      if (!roles.includes(req.userRole)) {
        logger.warn('Role check failed', {
          userId: req.user,
          userRole: req.userRole,
          requiredRoles: roles,
          path: req.path,
        });
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required role: ${roles.join(' or ')}.`,
          },
        });
      }
      next();
    },
  ];
};

/**
 * Seller ownership check: ensures req.user owns the resource being accessed.
 * Pass the sellerId from the resource (usually from params or the DB record).
 * @param {Function} getOwnerId - async (req) => ownerIdString
 */
const requireOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (req.userRole === 'admin') {
        return next(); // admins bypass ownership checks
      }

      const ownerId = await getOwnerId(req);
      if (!ownerId || ownerId.toString() !== req.user.toString()) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this resource.',
          },
        });
      }
      next();
    } catch (err) {
      logger.error('Ownership check error', { error: err.message });
      res.status(500).json({
        error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
      });
    }
  };
};

module.exports = { requireRole, requireOwnership };
