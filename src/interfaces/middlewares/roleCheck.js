const ResponseBuilder = require('../../utils/responseBuilder');

// Middleware para validar que el usuario autenticado posea alguno de los roles permitidos
const roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseBuilder.error(res, 'Acceso no autorizado', 403);
    }

    // Se extrae la lista de roles del usuario, soportando formato de arreglo o propiedad unica
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : (req.user.role ? [req.user.role] : []);

    const allowedLower = allowedRoles.map(role => String(role).toLowerCase());

    const hasPermission = userRoles.some(userRole =>
      allowedLower.includes(String(userRole).toLowerCase())
    );

    if (!hasPermission) {
      return ResponseBuilder.error(res, 'No tienes permisos para realizar esta accion', 403);
    }

    next();
  };
};

module.exports = roleCheck;
