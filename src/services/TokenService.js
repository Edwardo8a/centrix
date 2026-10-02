const jwt = require('jsonwebtoken');

class TokenService {
  constructor({ jwtConfig }) {
    this.jwtConfig = jwtConfig;
  }

  generateToken(payload) {
    return jwt.sign(payload, this.jwtConfig.secret, { expiresIn: this.jwtConfig.expiresIn });
  }
}

module.exports = TokenService;
