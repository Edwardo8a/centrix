const adminControllerFactory = require('../src/controllers/AdminController');

describe('AdminController', () => {
  let mockCreateUserHandler;
  let mockUpdateUserHandler;
  let mockDeleteUserHandler;
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    mockCreateUserHandler = { handle: jest.fn() };
    mockUpdateUserHandler = { handle: jest.fn() };
    mockDeleteUserHandler = { handle: jest.fn() };
    controller = adminControllerFactory({
      createUserHandler: mockCreateUserHandler,
      updateUserHandler: mockUpdateUserHandler,
      deleteUserHandler: mockDeleteUserHandler
    });
    req = {
      params: { id: 'u-123' },
      body: {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Juan',
        apellido_pat: 'Pérez',
        apellido_mat: 'López',
        tel: '1234567890'
      },
      user: { id: 'admin-id' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('createUser', () => {
    it('debe crear un usuario exitosamente y responder 201', async () => {
      mockCreateUserHandler.handle.mockResolvedValue({ id: 'u-123' });

      await controller.createUser(req, res, next);

      expect(mockCreateUserHandler.handle).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Usuario creado correctamente',
          data: { id: 'u-123' }
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe invocar next(error) si el handler lanza una excepción', async () => {
      const error = new Error('Database error');
      mockCreateUserHandler.handle.mockRejectedValue(error);

      await controller.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    it('debe actualizar el usuario y responder 200', async () => {
      mockUpdateUserHandler.handle.mockResolvedValue({ id: 'u-123', nombre: 'Juan Modificado' });

      await controller.updateUser(req, res, next);

      expect(mockUpdateUserHandler.handle).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Usuario actualizado correctamente',
          data: { id: 'u-123', nombre: 'Juan Modificado' }
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe invocar next(error) si updateUserHandler falla', async () => {
      const error = new Error('Update error');
      mockUpdateUserHandler.handle.mockRejectedValue(error);

      await controller.updateUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUser', () => {
    it('debe eliminar el usuario y responder 200', async () => {
      mockDeleteUserHandler.handle.mockResolvedValue({ id: 'u-123', deleted: true });

      await controller.deleteUser(req, res, next);

      expect(mockDeleteUserHandler.handle).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Usuario eliminado correctamente',
          data: { id: 'u-123', deleted: true }
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe invocar next(error) si deleteUserHandler falla', async () => {
      const error = new Error('Delete error');
      mockDeleteUserHandler.handle.mockRejectedValue(error);

      await controller.deleteUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
