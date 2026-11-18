const UserRepository = require('../src/repositories/UserRepository');
const { createMemorySupabase } = require('./helpers/memorySupabase');

describe('UserRepository: roles por nombre', () => {
  let memory; let repository;
  beforeEach(() => { memory = createMemorySupabase(); repository = new UserRepository({ supabase: memory.client }); });
  it('resuelve Colaborador como ID 3 y no como Administrador ID 1', async () => {
    const result = await repository.create({ nombre: 'Ana', email: 'new@example.test', department_id: memory.ids.department }, 'new-user');
    expect(result.department_id).toBe(memory.ids.department);
    expect(memory.state.tables.user_roles.find(link => link.user_id === 'new-user').role_id).toBe(3);
  });
  it('valida el rol y el departamento antes de insertar el perfil', async () => {
    const before = memory.state.tables.users.length;
    await expect(repository.create({ role: 'root' }, 'new-user')).rejects.toMatchObject({ statusCode: 400 });
    await expect(repository.create({ role: 'gerente' }, 'new-user')).rejects.toMatchObject({ statusCode: 400 });
    expect(memory.state.tables.users).toHaveLength(before);
  });
  it('no usa un ID alternativo cuando falta el rol en el catálogo', async () => {
    memory.state.tables.roles = [];
    await expect(repository.resolveAssignment('gerente', memory.ids.department)).rejects.toMatchObject({ statusCode: 400 });
  });
  it('limpia el perfil cuando falla la inserción en user_roles', async () => {
    memory.state.failRoleInsert = true;
    await expect(repository.create({ role: 'gerente', department_id: memory.ids.department }, 'new-user')).rejects.toThrow('Error al asignar el rol seleccionado');
    expect(memory.state.tables.users.some(user => user.id === 'new-user')).toBe(false);
  });
});
