const { validationResult } = require('express-validator');

/**
 * Middleware that runs express-validator result check.
 * Returns 422 with consistent error shape on validation failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      },
    });
  }
  next();
};

module.exports = validate;
