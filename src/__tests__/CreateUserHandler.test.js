const CreateUserHandler = require('../commands/admin/CreateUserHandler');
const CreateUserCommand = require('../commands/admin/CreateUserCommand');

describe('CreateUserHandler', () => {
  let mockAuthService;
  let mockUserRepository;
  let handler;

  beforeEach(() => {
    mockAuthService = {
      signUp: jest.fn(),
      deleteUser: jest.fn()
    };
    mockUserRepository = {
      create: jest.fn()
    };
    handler = new CreateUserHandler({
      authService: mockAuthService,
      userRepository: mockUserRepository
    });
  });

  it('debe devolver { id } y no llamar a deleteUser si todo es exitoso', async () => {
    mockAuthService.signUp.mockResolvedValue({ authId: 'auth-123' });
    mockUserRepository.create.mockResolvedValue({ id: 'user-123' });

    const command = new CreateUserCommand({
      email: 'test@test.com',
      password: 'password123',
      nombre: 'Test',
      apellido_pat: 'User',
      apellido_mat: '',
      tel: '123'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: 'user-123' });
    expect(mockAuthService.signUp).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      {
        nombre: 'Test',
        apellido_pat: 'User',
        apellido_mat: '',
        tel: '123',
        email: 'test@test.com'
      },
      'auth-123'
    );
    expect(mockAuthService.deleteUser).not.toHaveBeenCalled();
  });

  it('debe llamar a deleteUser y relanzar el error si userRepository.create falla', async () => {
    mockAuthService.signUp.mockResolvedValue({ authId: 'auth-123' });
    const dbError = new Error('Database error');
    mockUserRepository.create.mockRejectedValue(dbError);

    const command = new CreateUserCommand({ email: 'test@test.com', password: 'password123' });

    await expect(handler.handle(command)).rejects.toThrow(dbError);
    expect(mockAuthService.deleteUser).toHaveBeenCalledWith('auth-123');
  });

  it('no debe llamar a userRepository si authService.signUp falla', async () => {
    const authError = new Error('Auth error');
    mockAuthService.signUp.mockRejectedValue(authError);

    const command = new CreateUserCommand({ email: 'test@test.com', password: 'password123' });

    await expect(handler.handle(command)).rejects.toThrow(authError);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockAuthService.deleteUser).not.toHaveBeenCalled();
  });

  it('debe relanzar el error original incluso si deleteUser también falla', async () => {
    mockAuthService.signUp.mockResolvedValue({ authId: 'auth-123' });
    const dbError = new Error('Database error');
    mockUserRepository.create.mockRejectedValue(dbError);
    
    mockAuthService.deleteUser.mockRejectedValue(new Error('Delete user failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const command = new CreateUserCommand({ email: 'test@test.com', password: 'password123' });

    await expect(handler.handle(command)).rejects.toThrow(dbError);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
