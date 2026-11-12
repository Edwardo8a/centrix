const GetAllUsersHandler = require('../src/queries/users/GetAllUsersHandler');
const GetAllUsersQuery = require('../src/queries/users/GetAllUsersQuery');

describe('GetAllUsersHandler', () => {
  let mockUserReadModel;
  let handler;

  beforeEach(() => {
    mockUserReadModel = {
      getAllUsers: jest.fn()
    };
    handler = new GetAllUsersHandler({ userReadModel: mockUserReadModel });
  });

  it('debe ejecutar la consulta de usuarios correctamente con paginación por defecto', async () => {
    const mockResult = {
      items: [{ id: 'u-1', fullName: 'Carlos Pérez' }],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 }
    };
    mockUserReadModel.getAllUsers.mockResolvedValue(mockResult);

    const query = new GetAllUsersQuery();
    const result = await handler.handle(query);

    expect(mockUserReadModel.getAllUsers).toHaveBeenCalledWith({
      role: null,
      departmentId: null,
      search: null,
      page: 1,
      limit: 20
    });
    expect(result).toEqual(mockResult);
  });

  it('debe lanzar BusinessError si page no es un entero >= 1', async () => {
    const query = new GetAllUsersQuery({ page: 0 });
    await expect(handler.handle(query)).rejects.toThrow('El parámetro page debe ser un entero >= 1');
  });

  it('debe lanzar BusinessError si limit no está entre 1 y 100', async () => {
    const query = new GetAllUsersQuery({ limit: 101 });
    await expect(handler.handle(query)).rejects.toThrow('El parámetro limit debe estar entre 1 y 100');
  });
});
