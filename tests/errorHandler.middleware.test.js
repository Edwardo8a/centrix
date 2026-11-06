const errorHandler = require('../src/middlewares/errorHandler');
const ResponseBuilder = require('../src/utils/responseBuilder');
const logger = require('../src/utils/logger');

jest.mock('../src/utils/responseBuilder');
jest.mock('../src/utils/logger');

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
    ResponseBuilder.error.mockReturnValue('error-response');
  });

  it('debe manejar errores 4xx con statusCode, message y errors definidos', () => {
    const err = { statusCode: 400, message: 'Custom error', errors: ['error1'], stack: 'stack' };

    const result = errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Custom error', { stack: 'stack' });
    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Custom error', 400, ['error1']);
    expect(result).toBe('error-response');
  });

  it('debe manejar errores sin propiedades definidas usando valores por defecto', () => {
    const err = new Error();
    delete err.message;

    errorHandler(err, req, res, next);

    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Error interno del servidor', 500, null);
  });

  it('no debe exponer err.message al cliente en errores 500 o crudos de Supabase', () => {
    const rawSupabaseError = new Error('duplicate key value violates unique constraint "tickets_pkey"');
    rawSupabaseError.stack = 'db-stack';

    errorHandler(rawSupabaseError, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'duplicate key value violates unique constraint "tickets_pkey"',
      { stack: 'db-stack' }
    );
    expect(ResponseBuilder.error).toHaveBeenCalledWith(res, 'Error interno del servidor', 500, null);
  });
});
