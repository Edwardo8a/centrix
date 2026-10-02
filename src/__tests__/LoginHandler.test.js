const LoginHandler = require('../commands/auth/LoginHandler');
const LoginCommand = require('../commands/auth/LoginCommand');
const BusinessError = require('../exceptions/BusinessError');

describe('LoginHandler', () => {
  let mockAuthService;
  let mockUserReadModel;
  let mockTokenService;
  let handler;

  beforeEach(() => {
    mockAuthService = {
      signIn: jest.fn()
    };
    mockUserReadModel = {
      findById: jest.fn()
    };
    mockTokenService = {
      generateToken: jest.fn()
    };
    handler = new LoginHandler({ 
      authService: mockAuthService, 
      userReadModel: mockUserReadModel,
      tokenService: mockTokenService
    });
  });

  it('debe devolver { user, token } cuando todo es válido', async () => {
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-123' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'user-123',
      nombre: 'Juan',
      apellido_pat: 'Pérez',
      apellido_mat: 'López',
      tel: '123456',
      role: 'admin',
      roles: ['admin', 'user']
    });
    mockTokenService.generateToken.mockReturnValue('fake-jwt-token');

    const command = new LoginCommand({ email: 'test@test.com', password: 'password123' });
    const result = await handler.handle(command);

    expect(result).toEqual({
      user: {
        id: 'user-123',
        email: 'test@test.com',
        fullName: 'Juan Pérez López',
        role: 'admin',
        roles: ['admin', 'user'],
        tel: '123456'
      },
      token: 'fake-jwt-token'
    });

    expect(mockAuthService.signIn).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(mockUserReadModel.findById).toHaveBeenCalledWith('auth-123');
    expect(mockTokenService.generateToken).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@test.com',
      role: 'admin',
      roles: ['admin', 'user']
    });
  });

  it('debe lanzar BusinessError 401 si las credenciales son inválidas y no llamar al userRepository', async () => {
    mockAuthService.signIn.mockRejectedValue(new BusinessError('Credenciales invalidas', 401));

    const command = new LoginCommand({ email: 'wrong@test.com', password: 'wrong' });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 401);
    expect(mockUserReadModel.findById).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 404 si el usuario existe en Auth pero no en la tabla users', async () => {
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-not-in-db' });
    mockUserReadModel.findById.mockResolvedValue(null);

    const command = new LoginCommand({ email: 'test@test.com', password: 'password123' });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 404);
  });
});
