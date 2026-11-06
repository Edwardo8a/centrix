const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { userReadModel } = require('../config/container');
const ResponseBuilder = require('../utils/responseBuilder');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseBuilder.error(res, 'Token no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret);
  } catch {
    return ResponseBuilder.error(res, 'Token no valido o expirado', 401);
  }

  try {
    const dbUser = await userReadModel.findById(decoded.id);
    if (!dbUser) {
      return ResponseBuilder.error(res, 'Usuario no encontrado o inactivo', 401);
    }

    req.user = {
      id: dbUser.id,
      email: decoded.email,
      role: dbUser.role,
      roles: Array.isArray(dbUser.roles) ? dbUser.roles : (dbUser.role ? [dbUser.role] : []),
      department_id: dbUser.department_id ?? null
    };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
