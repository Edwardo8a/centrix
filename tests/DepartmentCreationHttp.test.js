const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/supabaseClient', () => {
  const memory = require('./helpers/memorySupabase').createMemorySupabase();
  return { dataClient: memory.client, authClient: memory.client, adminClient: memory.client, memory };
});

const { memory } = require('../src/config/supabaseClient');
const app = require('../src/app');
const jwtConfig = require('../src/config/jwt');

const path = '/api/departments';
const token = user => `Bearer ${jwt.sign({ id: memory.ids[user] }, jwtConfig.secret)}`;
const create = (user, body) => request(app).post(path).set('Authorization', token(user)).send(body);

describe('creación de departamentos por HTTP', () => {
  beforeEach(() => memory.state.reset());
  afterEach(() => jest.restoreAllMocks());

  it('crea un departamento y lo devuelve en la consulta existente', async () => {
    const response = await create('admin', { name: ' Compras ', description: ' Adquisiciones ' });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      departmentId: expect.any(String),
      name: 'Compras',
      description: 'Adquisiciones'
    });

    const list = await request(app).get(path).set('Authorization', token('creator'));
    expect(list.status).toBe(200);
    expect(list.body.data).toContainEqual(response.body.data);
  });

  it('permite crear sin descripción', async () => {
    const response = await create('admin', { name: 'Compras' });
    expect(response.status).toBe(201);
    expect(response.body.data.description).toBeNull();
  });

  it('rechaza solicitudes sin sesión o sin rol de administrador', async () => {
    const payload = { name: 'Compras' };
    expect((await request(app).post(path).send(payload)).status).toBe(401);
    expect((await create('manager', payload)).status).toBe(403);
    expect(memory.state.tables.departments).toHaveLength(2);
  });

  it('rechaza nombres vacíos y campos de tipo incorrecto', async () => {
    for (const payload of [{}, { name: '  ' }, { name: 42 }, { name: 'Compras', description: [] }]) {
      expect((await create('admin', payload)).status).toBe(400);
    }
    expect(memory.state.tables.departments).toHaveLength(2);
  });

  it('responde 409 si PostgreSQL reporta un conflicto de unicidad', async () => {
    const from = memory.client.from;
    jest.spyOn(memory.client, 'from').mockImplementation(table => {
      const query = from(table);
      if (table !== 'departments') return query;
      jest.spyOn(query, 'single').mockResolvedValue({ data: null, error: { code: '23505' } });
      return query;
    });

    const response = await create('admin', { name: 'Operaciones' });
    expect(response.status).toBe(409);
    expect(memory.state.tables.departments).toHaveLength(2);
  });
});
