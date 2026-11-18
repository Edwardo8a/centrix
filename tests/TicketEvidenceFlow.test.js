const { Buffer } = require('buffer');
const request = require('supertest');
const jwt = require('jsonwebtoken');
jest.mock('../src/config/supabaseClient', () => {
  const memory = require('./helpers/memorySupabase').createMemorySupabase();
  return { dataClient: memory.client, authClient: memory.client, adminClient: memory.client, memory };
});
const { memory } = require('../src/config/supabaseClient');
const app = require('../src/app');
const jwtConfig = require('../src/config/jwt');
const { ids, state } = memory;
const token = name => `Bearer ${jwt.sign({ id: ids[name] }, jwtConfig.secret)}`;
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const newTicket = () => request(app).post('/api/tickets').set('Authorization', token('creator'))
  .send({ title: 'Equipo sin red', description: 'Prueba', priority: 'Alta', department_id: ids.department });
const upload = id => request(app).post(`/api/tickets/${id}/evidences`).set('Authorization', token('creator'));

describe('flujo HTTP de ticket y evidencia con persistencia simulada', () => {
  beforeEach(() => state.reset());

  it('crea, sube al bucket y recupera evidencia desde ambos contratos', async () => {
    const created = await newTicket();
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    const result = await upload(id).attach('file', png, { filename: 'red.png', contentType: 'image/png' });
    expect(result.status).toBe(201);
    expect(result.body.data).toMatchObject({ ticketId: id, mimeType: 'image/png', size: png.length });
    expect(state.objects.size).toBe(1);
    expect(state.tables.ticket_attachments[0].file_url).toContain('evidencias/tickets/');
    const list = await request(app).get(`/api/tickets/${id}/evidences`).set('Authorization', token('creator'));
    expect(list.status).toBe(200);
    expect(list.body.data[0].signedUrl).toContain('signed=true');
    const detail = await request(app).get(`/api/tickets/${id}`).set('Authorization', token('creator'));
    expect(detail.status).toBe(200);
    expect(detail.body.data.attachments[0].signedUrl).toContain('signed=true');
  });

  it('retira el objeto si falla el registro y permite reintentar sin crear otro ticket', async () => {
    const { body } = await newTicket(); const id = body.data.id;
    state.failInsert = true;
    expect((await upload(id).attach('file', png, { filename: 'red.png', contentType: 'image/png' })).status).toBe(500);
    expect(state.objects.size).toBe(0);
    state.failInsert = false;
    expect((await upload(id).attach('file', png, { filename: 'red.png', contentType: 'image/png' })).status).toBe(201);
    expect(state.tables.tickets).toHaveLength(1);
    expect(state.tables.ticket_attachments).toHaveLength(1);
  });

  it('impide consultar o subir desde otro departamento', async () => {
    const { body } = await newTicket(); const id = body.data.id;
    for (const method of ['get', 'post']) {
      let req = request(app)[method](`/api/tickets/${id}/evidences`).set('Authorization', token('outsider'));
      if (method === 'post') req = req.attach('file', png, { filename: 'red.png', contentType: 'image/png' });
      expect((await req).status).toBe(403);
    }
    expect(state.objects.size).toBe(0);
  });

  it('rechaza contenido falso, archivos grandes y solicitudes sin sesión', async () => {
    const { body } = await newTicket(); const id = body.data.id;
    expect((await upload(id).attach('file', Buffer.from('falso'), { filename: 'x.png', contentType: 'image/png' })).status).toBe(400);
    expect((await upload(id).attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'x.png', contentType: 'image/png' })).status).toBe(413);
    expect((await request(app).get(`/api/tickets/${id}/evidences`)).status).toBe(401);
    expect(state.objects.size).toBe(0);
  });

  it('consulta pendientes del departamento y excluye resueltos y eliminados', async () => {
    const first = (await newTicket()).body.data.id;
    await newTicket(); state.tables.tickets[1].status = 'Resuelto';
    await newTicket(); state.tables.tickets[2].department_id = ids.otherDepartment;
    await newTicket(); state.tables.tickets[3].deleted_at = new Date().toISOString();
    const result = await request(app).get('/api/tickets/pending').set('Authorization', token('manager'));
    expect(result.status).toBe(200);
    expect(result.body.data.map(row => row.ticketId)).toEqual([first]);
  });

  it('firma rutas antiguas sin prefijo del bucket', async () => {
    const id = (await newTicket()).body.data.id;
    state.tables.ticket_attachments.push({ id: 'old', ticket_id: id, file_url: `tickets/${id}/old.png`, file_format: 'image/png', size_bytes: 9 });
    const detail = await request(app).get(`/api/tickets/${id}`).set('Authorization', token('creator'));
    expect(detail.body.data.attachments[0].signedUrl).toContain(`evidencias/tickets/${id}/old.png`);
  });
});
