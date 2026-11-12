const UpdateUserHandler = require('../src/commands/users/UpdateUserHandler');
const UpdateUserCommand = require('../src/commands/users/UpdateUserCommand');

describe('UpdateUserHandler', () => {
  let mockUserRepository;
  let handler;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };
    handler = new UpdateUserHandler({ userRepository: mockUserRepository });
  });

  it('debe actualizar los datos del usuario si existe', async () => {
    mockUserRepository.findById.mockResolvedValue({ id: 'u-1', full_name: 'Juan' });
    mockUserRepository.update.mockResolvedValue({
      id: 'u-1',
      full_name: 'Juan Carlos',
      apellido_pat: 'Pérez',
      apellido_mat: 'Gómez',
      tel: '1234567890',
      department_id: 'dept-1'
    });

    const command = new UpdateUserCommand({
      userId: 'u-1',
      nombre: 'Juan Carlos',
      apellido_pat: 'Pérez',
      apellido_mat: 'Gómez',
      tel: '1234567890',
      departmentId: 'dept-1'
    });

    const result = await handler.handle(command);

    expect(mockUserRepository.findById).toHaveBeenCalledWith('u-1');
    expect(mockUserRepository.update).toHaveBeenCalledWith('u-1', {
      nombre: 'Juan Carlos',
      apellido_pat: 'Pérez',
      apellido_mat: 'Gómez',
      tel: '1234567890',
      departmentId: 'dept-1',
      role: undefined
    });
    expect(result).toEqual({
      id: 'u-1',
      nombre: 'Juan Carlos',
      apellido_pat: 'Pérez',
      apellido_mat: 'Gómez',
      tel: '1234567890',
      departmentId: 'dept-1'
    });
  });

  it('debe lanzar BusinessError 404 si el usuario no existe', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const command = new UpdateUserCommand({ userId: 'u-none', nombre: 'Test' });

    await expect(handler.handle(command)).rejects.toThrow('Usuario no encontrado');
    expect(mockUserRepository.update).not.toHaveBeenCalled();
  });
});
