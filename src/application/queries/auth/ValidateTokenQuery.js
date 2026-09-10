const jwt = require('jsonwebtoken');
const jwtConfig = require('../../../config/jwt');
const BusinessError = require('../../../core/exceptions/BusinessError');

class ValidateTokenQuery {
  async execute(token) {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      return decoded;
    } catch (err) {
      throw new BusinessError('Token inválido o expirado', 401);
    }
  }
}

module.exports = ValidateTokenQuery;
