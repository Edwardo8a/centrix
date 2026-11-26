const LoginHandler = require('../commands/auth/LoginHandler');
const LoginCommand = require('../commands/auth/LoginCommand');
const BusinessError = require('../exceptions/BusinessError');

describe('Pruebas Automatizadas con Patrón AAA - LoginHandler', () => {
  let mockAuthService;
  let mockUserReadModel;
  let mockTokenService;
  let handler;

  beforeEach(() => {
    mockAuthService = { signIn: jest.fn() };
    mockUserReadModel = { findById: jest.fn() };
    mockTokenService = { generateToken: jest.fn() };

    handler = new LoginHandler({
      authService: mockAuthService,
      userReadModel: mockUserReadModel,
      tokenService: mockTokenService
    });
  });

  // =========================================================================
  // CASO 1: Inicio de sesión exitoso con generación de token JWT
  // =========================================================================
  it('CP01: Debe autenticar y retornar el usuario formateado con su token JWT', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-uuid-123' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-uuid-123',
      nombre: 'Juan',
      apellido_pat: 'Perez',
      apellido_mat: 'Lopez',
      tel: '4271234567',
      role: 'administrador',
      roles: ['administrador']
    });
    mockTokenService.generateToken.mockReturnValue('jwt-token-valido-xyz');

    const command = new LoginCommand({
      email: 'juan.perez@empresa.com',
      password: 'PasswordSeguro123!'
    });

    // // ACT
    const result = await handler.handle(command);

    // // ASSERT
    expect(result).toEqual({
      user: {
        id: 'usr-uuid-123',
        email: 'juan.perez@empresa.com',
        fullName: 'Juan Perez Lopez',
        role: 'administrador',
        roles: ['administrador'],
        tel: '4271234567'
      },
      token: 'jwt-token-valido-xyz'
    });
    expect(mockAuthService.signIn).toHaveBeenCalledWith('juan.perez@empresa.com', 'PasswordSeguro123!');
    expect(mockUserReadModel.findById).toHaveBeenCalledWith('auth-uuid-123');
    expect(mockTokenService.generateToken).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // CASO 2: Credenciales inválidas rechazan la petición con 401
  // =========================================================================
  it('CP02: Debe lanzar BusinessError 401 si las credenciales en Auth fallan', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockRejectedValue(new BusinessError('Credenciales invalidas', 401));
    const command = new LoginCommand({
      email: 'usuario@correo.com',
      password: 'passwordIncorrecto'
    });

    // // ACT & // ASSERT
    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 401);
    expect(mockUserReadModel.findById).not.toHaveBeenCalled();
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  // =========================================================================
  // CASO 3: Usuario autenticado en Auth pero inexistente en tabla de negocio
  // =========================================================================
  it('CP03: Debe lanzar BusinessError 404 si el usuario no tiene registro en base de datos', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-huerfano-456' });
    mockUserReadModel.findById.mockResolvedValue(null);

    const command = new LoginCommand({
      email: 'huerfano@correo.com',
      password: 'Password123'
    });

    // // ACT & // ASSERT
    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 404);
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  // =========================================================================
  // CASO 4: Formateo de nombre completo sin apellido materno opcional
  // =========================================================================
  it('CP04: Debe concatenar correctamente el nombre sin apellido materno (espacios limpios)', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-single-last' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-456',
      nombre: 'Maria',
      apellido_pat: 'Gomez',
      apellido_mat: null,
      tel: '4429876543',
      role: 'colaborador',
      roles: ['colaborador']
    });
    mockTokenService.generateToken.mockReturnValue('jwt-token-maria');

    const command = new LoginCommand({
      email: 'maria.gomez@empresa.com',
      password: 'Password123!'
    });

    // // ACT
    const result = await handler.handle(command);

    // // ASSERT
    expect(result.user.fullName).toBe('Maria Gomez');
    expect(result.user.role).toBe('colaborador');
  });

  // =========================================================================
  // CASO 5: Parámetros transferidos a la firma del JWT son íntegros
  // =========================================================================
  it('CP05: Debe pasar los claims correctos (id, email, roles) al TokenService', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-789' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-789',
      nombre: 'Carlos',
      apellido_pat: 'Ruiz',
      apellido_mat: 'Diaz',
      tel: '112233',
      role: 'gerente',
      roles: ['gerente', 'soporte']
    });
    mockTokenService.generateToken.mockReturnValue('token-claims-test');

    const command = new LoginCommand({
      email: 'carlos.ruiz@empresa.com',
      password: 'Password123!'
    });

    // // ACT
    await handler.handle(command);

    // // ASSERT
    expect(mockTokenService.generateToken).toHaveBeenCalledWith({
      id: 'usr-789',
      email: 'carlos.ruiz@empresa.com',
      role: 'gerente',
      roles: ['gerente', 'soporte']
    });
  });
});
