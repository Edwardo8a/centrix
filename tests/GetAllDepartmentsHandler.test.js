const GetAllDepartmentsHandler = require('../src/queries/departments/GetAllDepartmentsHandler');
const GetAllDepartmentsQuery = require('../src/queries/departments/GetAllDepartmentsQuery');

describe('GetAllDepartmentsHandler', () => {
  let mockDepartmentReadModel;
  let handler;

  beforeEach(() => {
    mockDepartmentReadModel = {
      getAll: jest.fn()
    };
    handler = new GetAllDepartmentsHandler({ departmentReadModel: mockDepartmentReadModel });
  });

  it('debe devolver la lista que entrega el ReadModel mediante handle(query)', async () => {
    const mockData = [
      { departmentId: '1', name: 'IT', description: 'Tecnología' },
      { departmentId: '2', name: 'HR', description: 'Recursos Humanos' }
    ];
    mockDepartmentReadModel.getAll.mockResolvedValue(mockData);

    const query = new GetAllDepartmentsQuery();
    const result = await handler.handle(query);

    expect(result).toEqual(mockData);
    expect(mockDepartmentReadModel.getAll).toHaveBeenCalledTimes(1);
  });

  it('debe devolver [] cuando no hay departamentos', async () => {
    mockDepartmentReadModel.getAll.mockResolvedValue([]);

    const result = await handler.handle();

    expect(result).toEqual([]);
    expect(mockDepartmentReadModel.getAll).toHaveBeenCalledTimes(1);
  });
});
