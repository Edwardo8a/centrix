class ValidationError extends Error {
  constructor(errors, statusCode = 422) {
    super('Error de validación');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = statusCode;
  }
}

module.exports = ValidationError;
