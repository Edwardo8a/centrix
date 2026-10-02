const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const ResponseBuilder = require('../utils/responseBuilder');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseBuilder.error(res, 'Token no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch {
    return ResponseBuilder.error(res, 'Token no valido o expirado', 401);
  }
};

module.exports = authMiddleware;
