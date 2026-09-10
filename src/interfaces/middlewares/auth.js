const ValidateTokenUseCase = require('../../application/auth/ValidateTokenUseCase');
const ResponseBuilder = require('../../utils/responseBuilder');

const validateTokenUseCase = new ValidateTokenUseCase();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseBuilder.error(res, 'Token no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await validateTokenUseCase.execute(token);
    req.user = decoded;
    next();
  } catch (error) {
    return ResponseBuilder.error(res, error.message || 'Token no válido', 401);
  }
};

module.exports = authMiddleware;
