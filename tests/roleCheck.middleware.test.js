const roleCheck = require('../src/middlewares/roleCheck');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('roleCheck', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    ResponseBuilder.error.mockReturnValue('error-response');
  });

  it('debe retornar 401 si no hay req.user', () => {
    const middleware = roleCheck();
    const result = middleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Acceso no autorizado', 401);
    expect(result).toBe('error-response');
  });

  it('debe retornar 403 si el usuario no tiene roles definidos', () => {
    req.user = {};
    const middleware = roleCheck(['administrador']);

    middleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'No tienes permisos para realizar esta accion', 403);
  });

  it('debe retornar 403 si el rol no esta permitido (array roles)', () => {
    req.user = { roles: ['colaborador'] };
    const middleware = roleCheck(['administrador']);

    middleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'No tienes permisos para realizar esta accion', 403);
  });

  it('debe retornar 403 si el rol simple no esta permitido', () => {
    req.user = { role: 'colaborador' };
    const middleware = roleCheck(['administrador']);

    middleware(req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'No tienes permisos para realizar esta accion', 403);
  });

  it('debe permitir si alguno de los roles en roles[] coincide (multi-rol e ignora mayusculas)', () => {
    req.user = { role: 'gerente', roles: ['colaborador', 'GERENTE'] };
    const middleware = roleCheck(['gerente', 'administrador']);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
