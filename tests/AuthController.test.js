const authControllerFactory = require('../src/controllers/AuthController');

describe('AuthController', () => {
  let mockLoginHandler;
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockLoginHandler = {
      handle: jest.fn()
    };
    controller = authControllerFactory({ loginHandler: mockLoginHandler });
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('debe iniciar sesión exitosamente y responder 200', async () => {
    mockLoginHandler.handle.mockResolvedValue({
      user: { id: 'u-1' },
      token: 'jwt-token'
    });

    await controller.login(req, res, next);

    expect(mockLoginHandler.handle).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Inicio de sesion exitoso',
        data: {
          user: { id: 'u-1' },
          token: 'jwt-token'
        }
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe invocar next(error) si el handler falla', async () => {
    const error = new Error('Credenciales inválidas');
    mockLoginHandler.handle.mockRejectedValue(error);

    await controller.login(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
