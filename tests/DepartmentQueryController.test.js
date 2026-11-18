const departmentQueryControllerFactory = require('../src/controllers/DepartmentQueryController');

describe('DepartmentQueryController', () => {
  let mockHandler;
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockHandler = {
      handle: jest.fn()
    };
    controller = departmentQueryControllerFactory({ getAllDepartmentsHandler: mockHandler });
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  it('debe obtener la lista de departamentos y responder 200', async () => {
    const departments = [{ departmentId: 'd-1', name: 'IT' }];
    mockHandler.handle.mockResolvedValue(departments);

    await controller.getAll(req, res, next);

    expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Departamentos obtenidos exitosamente',
        data: departments
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe soportar handler con método execute()', async () => {
    const executeHandler = {
      execute: jest.fn().mockResolvedValue([{ departmentId: 'd-2', name: 'HR' }])
    };
    const ctrl = departmentQueryControllerFactory({ getAllDepartmentsHandler: executeHandler });

    await ctrl.getAll(req, res, next);

    expect(executeHandler.execute).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('debe invocar next(error) si el handler lanza una excepción', async () => {
    const error = new Error('Read error');
    mockHandler.handle.mockRejectedValue(error);

    await controller.getAll(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
