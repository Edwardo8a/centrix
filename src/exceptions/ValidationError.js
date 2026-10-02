class ValidationError extends Error {
  constructor(messageOrErrors, statusCode = 400) {
    const isString = typeof messageOrErrors === 'string';
    super(isString ? messageOrErrors : 'Error de validación');
    this.name = 'ValidationError';
    this.errors = isString ? null : messageOrErrors;
    this.statusCode = statusCode;
  }
}

module.exports = ValidationError;
