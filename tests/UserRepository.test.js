const UserRepository = require('../src/repositories/UserRepository');
const UserRole = require('../src/enums/UserRole');

describe('UserRepository', () => {
  let mockSupabase;
  let repository;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn()
    };
    repository = new UserRepository({ supabase: mockSupabase });
  });

  it('debe crear el usuario y asignarle el rol colaborador resuelto por descripcion (case-insensitive)', async () => {
    const userRecord = { id: 'auth-uuid-1', email: 'saori@centrix.com' };

    const singleUserMock = jest.fn().mockResolvedValue({ data: userRecord, error: null });
    const selectUserMock = jest.fn().mockReturnValue({ single: singleUserMock });
    const insertUserMock = jest.fn().mockReturnValue({ select: selectUserMock });

    const maybeSingleRoleMock = jest.fn().mockResolvedValue({
      data: { id: 3, descripcion: 'Colaborador' },
      error: null
    });
    const ilikeRoleMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleRoleMock });
    const selectRoleMock = jest.fn().mockReturnValue({ ilike: ilikeRoleMock });

    const insertUserRoleMock = jest.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') return { insert: insertUserMock };
      if (table === 'roles') return { select: selectRoleMock };
      if (table === 'user_roles') return { insert: insertUserRoleMock };
      return {};
    });

    const result = await repository.create(
      {
        nombre: 'Saori',
        apellido_pat: 'Test',
        apellido_mat: '',
        tel: '5551234',
        email: 'saori@centrix.com'
      },
      'auth-uuid-1'
    );

    expect(result).toEqual(userRecord);
    expect(ilikeRoleMock).toHaveBeenCalledWith('descripcion', UserRole.COLABORADOR);
    expect(insertUserRoleMock).toHaveBeenCalledWith([
      {
        user_id: 'auth-uuid-1',
        role_id: 3
      }
    ]);
  });

  it('debe lanzar error si falla la inserción en users', async () => {
    const singleUserMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Duplicate email' }
    });
    const selectUserMock = jest.fn().mockReturnValue({ single: singleUserMock });
    const insertUserMock = jest.fn().mockReturnValue({ select: selectUserMock });

    mockSupabase.from.mockReturnValue({ insert: insertUserMock });

    await expect(repository.create({ email: 'a@b.com' }, 'u1')).rejects.toThrow(
      'Error al crear el usuario: Duplicate email'
    );
  });

  it('debe hacer rollback del usuario en users si no se encuentra el rol colaborador', async () => {
    const userRecord = { id: 'auth-uuid-1' };
    const singleUserMock = jest.fn().mockResolvedValue({ data: userRecord, error: null });
    const selectUserMock = jest.fn().mockReturnValue({ single: singleUserMock });
    const insertUserMock = jest.fn().mockReturnValue({ select: selectUserMock });

    const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteUserMock = jest.fn().mockReturnValue({ eq: deleteEqMock });

    const maybeSingleRoleMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const ilikeRoleMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleRoleMock });
    const selectRoleMock = jest.fn().mockReturnValue({ ilike: ilikeRoleMock });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') return { insert: insertUserMock, delete: deleteUserMock };
      if (table === 'roles') return { select: selectRoleMock };
      return {};
    });

    await expect(repository.create({ email: 'a@b.com' }, 'auth-uuid-1')).rejects.toThrow(
      /Error al obtener el rol por defecto/
    );
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'auth-uuid-1');
  });

  it('debe hacer rollback del usuario en users si falla la inserción en user_roles', async () => {
    const userRecord = { id: 'auth-uuid-1' };
    const singleUserMock = jest.fn().mockResolvedValue({ data: userRecord, error: null });
    const selectUserMock = jest.fn().mockReturnValue({ single: singleUserMock });
    const insertUserMock = jest.fn().mockReturnValue({ select: selectUserMock });

    const deleteEqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteUserMock = jest.fn().mockReturnValue({ eq: deleteEqMock });

    const maybeSingleRoleMock = jest.fn().mockResolvedValue({
      data: { id: 3, descripcion: 'Colaborador' },
      error: null
    });
    const ilikeRoleMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleRoleMock });
    const selectRoleMock = jest.fn().mockReturnValue({ ilike: ilikeRoleMock });

    const insertUserRoleMock = jest.fn().mockResolvedValue({
      error: { message: 'FK violation' }
    });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') return { insert: insertUserMock, delete: deleteUserMock };
      if (table === 'roles') return { select: selectRoleMock };
      if (table === 'user_roles') return { insert: insertUserRoleMock };
      return {};
    });

    await expect(repository.create({ email: 'a@b.com' }, 'auth-uuid-1')).rejects.toThrow(
      'Error al asignar el rol por defecto: FK violation'
    );
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'auth-uuid-1');
  });
});

