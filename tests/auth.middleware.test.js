const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/auth');
const { userReadModel } = require('../src/config/container');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('jsonwebtoken');
jest.mock('../src/config/container', () => ({
  userReadModel: {
    findById: jest.fn()
  }
}));
jest.mock('../src/utils/responseBuilder');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
    ResponseBuilder.error.mockReturnValue('error-response');
  });

  it('debe retornar 401 si no hay token proporcionado', async () => {
    req.headers.authorization = '';

    const result = await authMiddleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Token no proporcionado', 401);
    expect(result).toBe('error-response');
  });

  it('debe retornar 401 si el token no es Bearer', async () => {
    req.headers.authorization = 'Basic asdf';

    await authMiddleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Token no proporcionado', 401);
  });

  it('debe retornar 401 si el token es invalido', async () => {
    req.headers.authorization = 'Bearer token-invalido';
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid');
    });

    await authMiddleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Token no valido o expirado', 401);
  });

  it('debe retornar 401 si el usuario no existe en la base de datos', async () => {
    req.headers.authorization = 'Bearer token-valido';
    jwt.verify.mockReturnValue({ id: 'u-inexistente', email: 'no@existe.com' });
    userReadModel.findById.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(userReadModel.findById).toHaveBeenCalledWith('u-inexistente');
    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Usuario no encontrado o inactivo', 401);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe cargar role, roles y department_id desde BD en req.user cuando el token es valido', async () => {
    req.headers.authorization = 'Bearer token-valido';
    jwt.verify.mockReturnValue({ id: 'u-1', email: 'gerente@centrix.com', role: 'colaborador' });
    userReadModel.findById.mockResolvedValue({
      id: 'u-1',
      role: 'gerente',
      roles: ['colaborador', 'gerente'],
      department_id: 'dept-uuid-1'
    });

    await authMiddleware(req, res, next);

    expect(userReadModel.findById).toHaveBeenCalledWith('u-1');
    expect(req.user).toEqual({
      id: 'u-1',
      email: 'gerente@centrix.com',
      role: 'gerente',
      roles: ['colaborador', 'gerente'],
      department_id: 'dept-uuid-1'
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('debe pasar el error a next si userReadModel.findById lanza una excepcion', async () => {
    req.headers.authorization = 'Bearer token-valido';
    jwt.verify.mockReturnValue({ id: 'u-1', email: 'user@centrix.com' });
    const dbError = new Error('DB connection error');
    userReadModel.findById.mockRejectedValue(dbError);

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});
