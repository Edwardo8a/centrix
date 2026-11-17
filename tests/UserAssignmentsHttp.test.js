const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
jest.mock('../src/config/supabaseClient', () => {
  const memory = require('./helpers/memorySupabase').createMemorySupabase();
  return { dataClient: memory.client, adminClient: memory.client, authClient: memory.client, memory };
});
const { memory } = require('../src/config/supabaseClient');
const { createUserHandler } = require('../src/config/container');
const app = require('../src/app');
const jwtConfig = require('../src/config/jwt');
const token = name => `Bearer ${jwt.sign({ id: memory.ids[name] }, jwtConfig.secret)}`;
const payload = () => ({ email: 'new@example.test', password: 'claveSegura123', nombre: 'Ana', apellido_pat: 'López',
  role: 'gerente', department_id: memory.ids.department });

describe('alta de usuario con rol y departamento', () => {
  beforeEach(() => {
    memory.state.reset();
    jest.spyOn(createUserHandler.authService, 'signUp').mockImplementation(async () => ({ authId: randomUUID() }));
    jest.spyOn(createUserHandler.authService, 'deleteUser').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());
  it('el catálogo normaliza Colaborador y solo es accesible por administrador', async () => {
    const response = await request(app).get('/api/admin/roles').set('Authorization', token('admin'));
    expect(response.status).toBe(200);
    expect(response.body.data.map(role => role.role)).toEqual(['administrador', 'gerente', 'colaborador', 'soporte_tecnico']);
    expect((await request(app).get('/api/admin/roles').set('Authorization', token('manager'))).status).toBe(403);
  });
  it('guarda Gerente en el departamento elegido y retira un rol automático equivocado', async () => {
    memory.state.autoRoleOnUserCreate = 1;
    const response = await request(app).post('/api/admin/users').set('Authorization', token('admin')).send(payload());
    expect(response.status).toBe(201);
    const id = response.body.data.id;
    expect(memory.state.tables.users.find(user => user.id === id).department_id).toBe(memory.ids.department);
    expect(memory.state.tables.user_roles.filter(link => link.user_id === id).map(link => link.role_id)).toEqual([2]);
  });
  it('rechaza rol desconocido y departamento faltante o inexistente antes de crear Auth', async () => {
    for (const bad of [{ role: 'supervisor' }, { department_id: null }, { department_id: randomUUID() }]) {
      const response = await request(app).post('/api/admin/users').set('Authorization', token('admin')).send({ ...payload(), ...bad });
      expect(response.status).toBe(400);
    }
    expect(createUserHandler.authService.signUp).not.toHaveBeenCalled();
  });
  it('permite un administrador sin departamento solo a otro administrador', async () => {
    const body = { ...payload(), role: 'administrador', department_id: null };
    expect((await request(app).post('/api/admin/users').set('Authorization', token('manager')).send(body)).status).toBe(403);
    const response = await request(app).post('/api/admin/users').set('Authorization', token('admin')).send(body);
    expect(response.status).toBe(201);
    expect(memory.state.tables.user_roles.find(link => link.user_id === response.body.data.id).role_id).toBe(1);
  });
  it('revierte el perfil y Auth cuando no puede guardar el rol', async () => {
    memory.state.failRoleInsert = true;
    const before = memory.state.tables.users.length;
    expect((await request(app).post('/api/admin/users').set('Authorization', token('admin')).send(payload())).status).toBe(500);
    expect(memory.state.tables.users).toHaveLength(before);
    expect(createUserHandler.authService.deleteUser).toHaveBeenCalled();
  });
});
