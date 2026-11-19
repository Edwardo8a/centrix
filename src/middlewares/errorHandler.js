const ResponseBuilder = require('../utils/responseBuilder');
const logger = require('../utils/logger');
const multer = require('multer');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'Error interno del servidor', { stack: err.stack });

  const statusCode = err instanceof multer.MulterError
    ? (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : (err.statusCode || 500);
  const isClientError = statusCode >= 400 && statusCode < 500;
  const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
    ? 'El archivo supera el límite de 5 MB'
    : (isClientError && err.message ? err.message : 'Error interno del servidor');
  const errors = isClientError ? (err.errors || null) : null;

  return ResponseBuilder.error(res, message, statusCode, errors);
};

module.exports = errorHandler;
