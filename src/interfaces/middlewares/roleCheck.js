const ResponseBuilder = require('../../utils/responseBuilder');

const roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return ResponseBuilder.error(res, 'Acceso no autorizado', 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ResponseBuilder.error(res, 'No tienes permisos para realizar esta acción', 403);
    }

    next();
  };
};

module.exports = roleCheck;
