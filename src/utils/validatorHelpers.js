const { validationResult } = require('express-validator');
const ValidationError = require('../core/exceptions/ValidationError');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()));
  }
  next();
};

module.exports = {
  validateResult
};
