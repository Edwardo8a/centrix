const GetDepartmentSolversQuery = require('../src/queries/users/GetDepartmentSolversQuery');
const GetDepartmentSolversHandler = require('../src/queries/users/GetDepartmentSolversHandler');
const userQueryControllerFactory = require('../src/controllers/UserQueryController');
const UserReadModel = require('../src/repositories/UserReadModel');
const UserRole = require('../src/enums/UserRole');
const ResponseBuilder = require('../src/utils/responseBuilder');

jest.mock('../src/utils/responseBuilder');

describe('GetDepartmentSolvers Feature (Query, Handler, Controller, ReadModel)', () => {
  describe('GetDepartmentSolversHandler', () => {
    let mockUserReadModel;
    let handler;

    beforeEach(() => {
      mockUserReadModel = {
        getSolversByDepartment: jest.fn()
      };
      handler = new GetDepartmentSolversHandler({ userReadModel: mockUserReadModel });
    });

    it('debe crear un DTO GetDepartmentSolversQuery inmutable', () => {
      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-1',
        departmentId: 'dept-2'
      });

      expect(Object.isFrozen(query)).toBe(true);
      expect(query.userRole).toBe(UserRole.GERENTE);
    });

    it('debe devolver los solucionadores del departamento del gerente e ignorar departmentId externo', async () => {
      const mockSolvers = [{ id: 'tech-1', fullName: 'Carlos Soporte' }];
      mockUserReadModel.getSolversByDepartment.mockResolvedValue(mockSolvers);

      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-regina',
        departmentId: 'dept-otro'
      });

      const result = await handler.handle(query);

      expect(result).toEqual(mockSolvers);
      expect(mockUserReadModel.getSolversByDepartment).toHaveBeenCalledWith('dept-regina');
    });

    it('debe lanzar BusinessError 403 si el gerente no tiene departamento asignado', async () => {
      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.GERENTE,
        userDepartmentId: null
      });

      await expect(handler.handle(query)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El gerente no tiene un departamento asignado',
        statusCode: 403
      });
      expect(mockUserReadModel.getSolversByDepartment).not.toHaveBeenCalled();
    });

    it('debe permitir al administrador consultar solucionadores enviando department_id', async () => {
      const mockSolvers = [{ id: 'tech-2', fullName: 'Elena Soporte' }];
      mockUserReadModel.getSolversByDepartment.mockResolvedValue(mockSolvers);

      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.ADMINISTRADOR,
        userDepartmentId: null,
        departmentId: 'dept-any'
      });

      const result = await handler.handle(query);

      expect(result).toEqual(mockSolvers);
      expect(mockUserReadModel.getSolversByDepartment).toHaveBeenCalledWith('dept-any');
    });

    it('debe lanzar BusinessError 400 si el administrador no envía department_id', async () => {
      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.ADMINISTRADOR,
        userDepartmentId: 'dept-propio-ignorado',
        departmentId: null
      });

      await expect(handler.handle(query)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El parámetro department_id es obligatorio para el administrador',
        statusCode: 400
      });
      expect(mockUserReadModel.getSolversByDepartment).not.toHaveBeenCalled();
    });

    it('debe lanzar BusinessError 403 si un rol no autorizado ejecuta la query', async () => {
      const query = new GetDepartmentSolversQuery({
        userRole: UserRole.COLABORADOR,
        userDepartmentId: 'dept-1'
      });

      await expect(handler.handle(query)).rejects.toMatchObject({
        name: 'BusinessError',
        statusCode: 403
      });
    });
  });

  describe('UserQueryController', () => {
    it('debe invocar getDepartmentSolversHandler y responder 200', async () => {
      const mockHandler = {
        handle: jest.fn().mockResolvedValue([{ id: 'tech-1', fullName: 'Carlos Soporte' }])
      };
      const controller = userQueryControllerFactory({
        getDepartmentSolversHandler: mockHandler
      });

      const req = {
        user: { id: 'regina', role: 'gerente', department_id: 'dept-1' },
        query: {}
      };
      const res = {};
      const next = jest.fn();
      ResponseBuilder.success.mockReturnValue('ok');

      await controller.getSolvers(req, res, next);

      expect(mockHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'gerente',
          userDepartmentId: 'dept-1',
          departmentId: null
        })
      );
      expect(ResponseBuilder.success).toHaveBeenCalledWith(
        res,
        [{ id: 'tech-1', fullName: 'Carlos Soporte' }],
        'Solucionadores obtenidos exitosamente',
        200
      );
    });

    it('debe pasar el error a next si el handler falla', async () => {
      const error = new Error('Fail');
      const mockHandler = { handle: jest.fn().mockRejectedValue(error) };
      const controller = userQueryControllerFactory({
        getDepartmentSolversHandler: mockHandler
      });

      const req = { user: { id: 'u1', role: 'gerente' }, query: {} };
      const res = {};
      const next = jest.fn();

      await controller.getSolvers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('UserReadModel.getSolversByDepartment', () => {
    it('debe devolver solo usuarios con rol soporte_tecnico y mapear únicamente id y fullName (sin email ni tel)', async () => {
      const rawUsers = [
        {
          id: 'u-tech',
          full_name: 'Carlos',
          apellido_pat: 'Ruiz',
          apellido_mat: 'Diaz',
          email: 'carlos@centrix.com',
          tel: '5559999',
          user_roles: [{ roles: { descripcion: 'Soporte_Tecnico' } }]
        },
        {
          id: 'u-colab',
          full_name: 'Saori',
          apellido_pat: 'Test',
          apellido_mat: '',
          user_roles: [{ roles: { descripcion: 'Colaborador' } }]
        }
      ];

      const eqMock = jest.fn().mockResolvedValue({ data: rawUsers, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      const mockSupabase = { from: jest.fn().mockReturnValue({ select: selectMock }) };

      const readModel = new UserReadModel({ supabase: mockSupabase });
      const result = await readModel.getSolversByDepartment('dept-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(eqMock).toHaveBeenCalledWith('department_id', 'dept-1');
      expect(result).toEqual([
        {
          id: 'u-tech',
          fullName: 'Carlos Ruiz Diaz'
        }
      ]);
      expect(result[0]).not.toHaveProperty('email');
      expect(result[0]).not.toHaveProperty('tel');
    });
  });
});

