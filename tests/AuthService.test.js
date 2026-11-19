const AuthService = require('../src/services/AuthService');
const BusinessError = require('../src/exceptions/BusinessError');

describe('AuthService', () => {
  let authService;
  let authClientMock;
  let adminClientMock;

  beforeEach(() => {
    authClientMock = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
      }
    };
    adminClientMock = {
      auth: {
        admin: {
          createUser: jest.fn(),
          deleteUser: jest.fn()
        }
      }
    };
    authService = new AuthService({ authClient: authClientMock, adminClient: adminClientMock });
  });

  it('debe lanzar BusinessError si las credenciales en signIn son invalidas', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'wrong';
    authClientMock.auth.signInWithPassword.mockResolvedValue({ error: new Error('Invalid login') });

    // Act
    let caughtError;
    try {
      await authService.signIn(email, password);
    } catch (e) {
      caughtError = e;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(BusinessError);
  });

  it('debe retornar authId al hacer signIn con credenciales validas', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    const fakeId = '123-abc';
    authClientMock.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: fakeId } }, error: null });

    // Act
    const result = await authService.signIn(email, password);

    // Assert
    expect(result).toEqual({ authId: fakeId });
    expect(authClientMock.auth.signInWithPassword).toHaveBeenCalledWith({ email, password });
  });

  it('debe lanzar BusinessError si falla al crear usuario en signUp', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    adminClientMock.auth.admin.createUser.mockResolvedValue({ error: new Error('Sign up failed') });

    // Act
    let caughtError;
    try {
      await authService.signUp(email, password);
    } catch (e) {
      caughtError = e;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(BusinessError);
  });

  it('debe retornar authId al hacer signUp con credenciales validas', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    const fakeId = '456-def';
    adminClientMock.auth.admin.createUser.mockResolvedValue({ data: { user: { id: fakeId } }, error: null });

    // Act
    const result = await authService.signUp(email, password);

    // Assert
    expect(result).toEqual({ authId: fakeId });
    expect(adminClientMock.auth.admin.createUser).toHaveBeenCalledWith({ email, password, email_confirm: true });
    expect(authClientMock.auth.signUp).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError cuando signUp devuelve datos sin usuario', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    adminClientMock.auth.admin.createUser.mockResolvedValue({ data: { user: null }, error: null });

    // Act
    let caughtError;
    try {
      await authService.signUp(email, password);
    } catch (e) {
      caughtError = e;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(BusinessError);
    expect(caughtError.message).toBe('No se pudo obtener el ID del usuario creado en Auth.');
  });

  it('debe lanzar BusinessError si adminClient no esta configurado al eliminar usuario', async () => {
    // Arrange
    const serviceWithoutAdmin = new AuthService({ authClient: authClientMock, adminClient: null });
    const authId = '123';

    // Act
    let caughtError;
    try {
      await serviceWithoutAdmin.deleteUser(authId);
    } catch (e) {
      caughtError = e;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(BusinessError);
    expect(caughtError.message).toBe('Admin client no está configurado (falta SUPABASE_SERVICE_ROLE_KEY)');
  });

  it('debe lanzar BusinessError si falla al eliminar usuario', async () => {
    // Arrange
    const authId = '123';
    adminClientMock.auth.admin.deleteUser.mockResolvedValue({ error: new Error('Delete failed') });

    // Act
    let caughtError;
    try {
      await authService.deleteUser(authId);
    } catch (e) {
      caughtError = e;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(BusinessError);
    expect(caughtError.message).toContain('Error al eliminar usuario en Auth');
  });

  it('debe eliminar usuario exitosamente', async () => {
    // Arrange
    const authId = '123';
    adminClientMock.auth.admin.deleteUser.mockResolvedValue({ error: null });

    // Act
    await authService.deleteUser(authId);

    // Assert
    expect(adminClientMock.auth.admin.deleteUser).toHaveBeenCalledWith(authId);
  });

  it('no recurre al registro público cuando falta la clave administrativa', async () => {
    const service = new AuthService({ authClient: authClientMock, adminClient: null });
    await expect(service.signUp('new@example.test', 'password123')).rejects.toMatchObject({ statusCode: 500 });
    expect(authClientMock.auth.signUp).not.toHaveBeenCalled();
  });

  it('identifica un correo existente sin crear perfiles nuevos', async () => {
    adminClientMock.auth.admin.createUser.mockResolvedValue({ error: { code: 'email_exists' } });
    await expect(authService.signUp('existing@example.test', 'password123')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('conserva el límite general de Supabase y devuelve un mensaje claro', async () => {
    adminClientMock.auth.admin.createUser.mockResolvedValue({ error: { status: 429 } });
    await expect(authService.signUp('new@example.test', 'password123')).rejects.toMatchObject({ statusCode: 429 });
  });
});
