const DeleteUserHandler = require('../src/commands/users/DeleteUserHandler');
const DeleteUserCommand = require('../src/commands/users/DeleteUserCommand');

describe('DeleteUserHandler', () => {
  let mockUserRepository;
  let handler;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      softDelete: jest.fn()
    };
    handler = new DeleteUserHandler({ userRepository: mockUserRepository });
  });

  it('debe realizar soft delete del usuario exitosamente', async () => {
    mockUserRepository.findById.mockResolvedValue({ id: 'u-1', full_name: 'Juan' });
    mockUserRepository.softDelete.mockResolvedValue({ id: 'u-1' });

    const command = new DeleteUserCommand({ userId: 'u-1', performedBy: 'admin-id' });

    const result = await handler.handle(command);

    expect(mockUserRepository.findById).toHaveBeenCalledWith('u-1');
    expect(mockUserRepository.softDelete).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1', deleted: true });
  });

  it('debe lanzar BusinessError 404 si el usuario no existe', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const command = new DeleteUserCommand({ userId: 'u-none', performedBy: 'admin-id' });

    await expect(handler.handle(command)).rejects.toThrow('Usuario no encontrado');
    expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
  });

  it('debe rechazar la eliminación si el usuario intenta eliminarse a sí mismo', async () => {
    mockUserRepository.findById.mockResolvedValue({ id: 'admin-1' });

    const command = new DeleteUserCommand({ userId: 'admin-1', performedBy: 'admin-1' });

    await expect(handler.handle(command)).rejects.toThrow('No puedes eliminar tu propia cuenta de usuario');
    expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
  });
});
