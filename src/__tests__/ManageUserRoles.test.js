const ManageUserCommand = require('../application/commands/admin/ManageUserCommand');
const BusinessError = require('../core/exceptions/BusinessError');

// Mock del repositorio
const mockUserRepository = {
  assignRoles: jest.fn()
};

describe('HU-11 / HU-12: Pruebas de Usuarios y Roles (ManageUserCommand)', () => {
  let manageUserCommand;

  beforeEach(() => {
    manageUserCommand = new ManageUserCommand(mockUserRepository);
    jest.clearAllMocks();
  });

  it('Debería asignar múltiples roles correctamente a un usuario', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const roleIds = [1, 2]; // Ej. Admin y Gerente

    // Simulamos que el repositorio hace su trabajo sin lanzar errores
    mockUserRepository.assignRoles.mockResolvedValue(true);

    const result = await manageUserCommand.updateUserRoles(userId, roleIds);

    expect(mockUserRepository.assignRoles).toHaveBeenCalledWith(userId, roleIds);
    expect(mockUserRepository.assignRoles).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: userId, roles: roleIds });
  });

  it('Debería arrojar un BusinessError si el arreglo de roles está vacío', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const roleIds = [];

    await expect(manageUserCommand.updateUserRoles(userId, roleIds))
      .rejects
      .toThrow(BusinessError);

    await expect(manageUserCommand.updateUserRoles(userId, roleIds))
      .rejects
      .toThrow('Debe proporcionar al menos un ID de rol en formato de arreglo.');

    expect(mockUserRepository.assignRoles).not.toHaveBeenCalled();
  });

  it('Debería arrojar un BusinessError si no se envía un arreglo (ej. undefined)', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    await expect(manageUserCommand.updateUserRoles(userId, undefined))
      .rejects
      .toThrow(BusinessError);

    expect(mockUserRepository.assignRoles).not.toHaveBeenCalled();
  });
});
