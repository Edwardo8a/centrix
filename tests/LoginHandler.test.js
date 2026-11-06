const LoginHandler = require('../src/commands/auth/LoginHandler');

describe('LoginHandler', () => {
  let loginHandler;
  let authServiceMock;
  let userReadModelMock;
  let tokenServiceMock;

  beforeEach(() => {
    authServiceMock = { signIn: jest.fn() };
    userReadModelMock = { findById: jest.fn() };
    tokenServiceMock = { generateToken: jest.fn() };
    loginHandler = new LoginHandler({
      authService: authServiceMock,
      userReadModel: userReadModelMock,
      tokenService: tokenServiceMock
    });
  });

  it('debe omitir los apellidos en fullName si no existen', async () => {
    // Arrange
    const command = { email: 'test@test.com', password: 'pwd' };
    authServiceMock.signIn.mockResolvedValue({ authId: 'auth1' });
    userReadModelMock.findById.mockResolvedValue({
      id: 'u1',
      nombre: 'Juan',
      // sin apellido_pat ni apellido_mat
      role: 'admin',
      roles: ['admin']
    });
    tokenServiceMock.generateToken.mockReturnValue('fake-token');

    // Act
    const result = await loginHandler.handle(command);

    // Assert
    expect(result.user.fullName).toBe('Juan');
  });

  it('debe incluir ambos apellidos si existen', async () => {
    // Arrange
    const command = { email: 'test@test.com', password: 'pwd' };
    authServiceMock.signIn.mockResolvedValue({ authId: 'auth1' });
    userReadModelMock.findById.mockResolvedValue({
      id: 'u1',
      nombre: 'Juan',
      apellido_pat: 'Perez',
      apellido_mat: 'Gomez',
      role: 'admin',
      roles: ['admin']
    });
    tokenServiceMock.generateToken.mockReturnValue('fake-token');

    // Act
    const result = await loginHandler.handle(command);

    // Assert
    expect(result.user.fullName).toBe('Juan Perez Gomez');
  });
});
