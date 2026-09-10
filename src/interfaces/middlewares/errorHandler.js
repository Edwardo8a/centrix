const ResponseBuilder = require('../../utils/responseBuilder');
const logger = require('../../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const errors = err.errors || null;

  return ResponseBuilder.error(res, message, statusCode, errors);
};

module.exports = errorHandler;
