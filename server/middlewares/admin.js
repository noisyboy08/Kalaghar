/**
 * Admin-only middleware (convenience alias for requireRole('admin')).
 * Kept for backward compatibility with existing route usages.
 */
const { requireRole } = require('./requireRole');

// requireRole returns an array of middleware [auth, roleCheck]
// Flatten into a single middleware for easy app.use(admin) usage
const adminMiddlewareArray = requireRole('admin');

// Export as array so route handlers can spread it: router.get('/path', ...admin, handler)
module.exports = adminMiddlewareArray;
