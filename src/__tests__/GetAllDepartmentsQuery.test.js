const GetAllDepartmentsQuery = require('../queries/departments/GetAllDepartmentsQuery');

describe('GetAllDepartmentsQuery', () => {
  let mockDepartmentReadModel;
  let query;

  beforeEach(() => {
    mockDepartmentReadModel = {
      getAll: jest.fn()
    };
    query = new GetAllDepartmentsQuery({ departmentReadModel: mockDepartmentReadModel });
  });

  it('debe devolver la lista que entrega el ReadModel', async () => {
    const mockData = [
      { departmentId: '1', name: 'IT', description: 'Tecnología' },
      { departmentId: '2', name: 'HR', description: 'Recursos Humanos' }
    ];
    mockDepartmentReadModel.getAll.mockResolvedValue(mockData);

    const result = await query.execute();

    expect(result).toEqual(mockData);
    expect(mockDepartmentReadModel.getAll).toHaveBeenCalledTimes(1);
  });

  it('debe devolver [] cuando no hay departamentos', async () => {
    mockDepartmentReadModel.getAll.mockResolvedValue([]);

    const result = await query.execute();

    expect(result).toEqual([]);
    expect(mockDepartmentReadModel.getAll).toHaveBeenCalledTimes(1);
  });
});
