const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const jwtConfig = require('../src/config/jwt');
const UserRole = require('../src/enums/UserRole');
const { userReadModel, ticketReadModel, ticketRepository } = require('../src/config/container');

describe('Ticket & Solver Routes HTTP Integration', () => {
  const adminId = '11111111-1111-4111-8111-111111111111';
  const gerenteId = '22222222-2222-4222-8222-222222222222';
  const colaboradorId = '33333333-3333-4333-8333-333333333333';
  const soporteId = '44444444-4444-4444-8444-444444444444';
  const otroColaboradorId = '55555555-5555-4555-8555-555555555555';
  const deptGerenteId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const otroDeptId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const validTicketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';

  const adminToken = jwt.sign({ id: adminId, email: 'admin@centrix.com' }, jwtConfig.secret);
  const gerenteToken = jwt.sign({ id: gerenteId, email: 'gerente@centrix.com' }, jwtConfig.secret);
  const colaboradorToken = jwt.sign({ id: colaboradorId, email: 'colab@centrix.com' }, jwtConfig.secret);
  const soporteToken = jwt.sign({ id: soporteId, email: 'soporte@centrix.com' }, jwtConfig.secret);

  beforeEach(() => {
    jest.spyOn(userReadModel, 'findById').mockImplementation(async (id) => {
      if (id === adminId) {
        return {
          id: adminId,
          nombre: 'Gerardo',
          role: UserRole.ADMINISTRADOR,
          roles: [UserRole.ADMINISTRADOR],
          department_id: null
        };
      }
      if (id === gerenteId) {
        return {
          id: gerenteId,
          nombre: 'Regina',
          role: UserRole.GERENTE,
          roles: [UserRole.GERENTE],
          department_id: deptGerenteId
        };
      }
      if (id === colaboradorId) {
        return {
          id: colaboradorId,
          nombre: 'Saori',
          role: UserRole.COLABORADOR,
          roles: [UserRole.COLABORADOR],
          department_id: deptGerenteId
        };
      }
      if (id === soporteId) {
        return {
          id: soporteId,
          nombre: 'Carlos Soporte',
          role: UserRole.SOPORTE_TECNICO,
          roles: [UserRole.SOPORTE_TECNICO],
          department_id: deptGerenteId
        };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/tickets (todos, solo administrador)', () => {
    beforeEach(() => {
      jest.spyOn(ticketReadModel, 'getAllTickets').mockImplementation(async (params) => ({
        items: [
          {
            ticketId: 't-global-1',
            title: 'Ticket Global',
            description: 'Detalle global',
            priority: params.priority || 'Alta',
            status: params.status || 'Abierto',
            departmentId: params.departmentId || deptGerenteId,
            createdAtIso: '2026-11-03T14:00:00Z',
            authorName: 'Saori',
            assignedToName: 'Sin asignar'
          }
        ],
        pagination: {
          total: 1,
          page: params.page,
          limit: params.limit,
          totalPages: 1
        }
      }));
    });

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get('/api/tickets');
      expect(response.statusCode).toBe(401);
    });

    it('debe responder 403 si el rol es colaborador, soporte_tecnico o gerente', async () => {
      for (const token of [colaboradorToken, soporteToken, gerenteToken]) {
        const response = await request(app)
          .get('/api/tickets')
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(403);
      }
    });

    it('debe responder 200 para administrador sin filtros usando paginación por defecto', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(ticketReadModel.getAllTickets).toHaveBeenCalledWith({
        status: null,
        departmentId: null,
        priority: null,
        page: 1,
        limit: 20
      });
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      });
    });

    it('debe responder 200 para administrador aplicando filtros opcionales y paginación', async () => {
      const response = await request(app)
        .get(`/api/tickets?status=rechazado&department_id=${deptGerenteId}&priority=Alta&page=2&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(ticketReadModel.getAllTickets).toHaveBeenCalledWith({
        status: 'Rechazado',
        departmentId: deptGerenteId,
        priority: 'Alta',
        page: 2,
        limit: 10
      });
    });

    it('debe responder 400 si status, department_id, priority, page o limit son inválidos', async () => {
      const resBadStatus = await request(app)
        .get('/api/tickets?status=Inexistente')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resBadStatus.statusCode).toBe(400);

      const resBadDept = await request(app)
        .get('/api/tickets?department_id=no-es-uuid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resBadDept.statusCode).toBe(400);

      const resBadPriority = await request(app)
        .get('/api/tickets?priority=Extrema')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resBadPriority.statusCode).toBe(400);

      const resBadPage = await request(app)
        .get('/api/tickets?page=0')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resBadPage.statusCode).toBe(400);

      const resBadLimit = await request(app)
        .get('/api/tickets?limit=101')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resBadLimit.statusCode).toBe(400);
    });
  });

  describe('GET /api/tickets/mine', () => {
    const allSimulatedTickets = [
      {
        ticketId: 't-colab-1',
        title: 'Ticket de Saori',
        description: 'Creado por colaboradora',
        priority: 'Media',
        status: 'Abierto',
        departmentId: deptGerenteId,
        createdAtIso: '2026-11-03T12:00:00Z',
        authorName: 'Saori',
        assignedToName: 'Sin asignar',
        _createdBy: colaboradorId
      },
      {
        ticketId: 't-gerente-1',
        title: 'Ticket de Regina',
        description: 'Creado por gerente',
        priority: 'Alta',
        status: 'En revision',
        departmentId: deptGerenteId,
        createdAtIso: '2026-11-03T11:00:00Z',
        authorName: 'Regina',
        assignedToName: 'Sin asignar',
        _createdBy: gerenteId
      },
      {
        ticketId: 't-otro-1',
        title: 'Ticket de Otro Usuario',
        description: 'No debe filtrarse a Saori',
        priority: 'Baja',
        status: 'Abierto',
        departmentId: deptGerenteId,
        createdAtIso: '2026-11-03T10:00:00Z',
        authorName: 'Otro',
        assignedToName: 'Sin asignar',
        _createdBy: otroColaboradorId
      }
    ];

    beforeEach(() => {
      jest.spyOn(ticketReadModel, 'getTicketsByCreator').mockImplementation(async (userId) => {
        return allSimulatedTickets
          .filter(t => t._createdBy === userId)
          .map(t => {
            const copy = { ...t };
            delete copy._createdBy;
            return copy;
          });
      });
    });

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get('/api/tickets/mine');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Token no proporcionado/i);
    });

    it('debe responder 200 para rol colaborador y devolver solo sus tickets', async () => {
      const response = await request(app)
        .get('/api/tickets/mine')
        .set('Authorization', `Bearer ${colaboradorToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Mis tickets obtenidos exitosamente',
        data: [
          expect.objectContaining({
            ticketId: 't-colab-1',
            title: 'Ticket de Saori',
            authorName: 'Saori'
          })
        ]
      });
      expect(ticketReadModel.getTicketsByCreator).toHaveBeenCalledWith(colaboradorId);
    });

    it('debe responder 200 para rol gerente', async () => {
      const response = await request(app)
        .get('/api/tickets/mine')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ticketId).toBe('t-gerente-1');
      expect(ticketReadModel.getTicketsByCreator).toHaveBeenCalledWith(gerenteId);
    });

    it('debe responder 200 para rol soporte_tecnico', async () => {
      const response = await request(app)
        .get('/api/tickets/mine')
        .set('Authorization', `Bearer ${soporteToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(ticketReadModel.getTicketsByCreator).toHaveBeenCalledWith(soporteId);
    });

    it('debe responder 200 para rol administrador', async () => {
      const response = await request(app)
        .get('/api/tickets/mine')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(ticketReadModel.getTicketsByCreator).toHaveBeenCalledWith(adminId);
    });

    it('nunca debe devolver tickets de otro usuario aunque se envíe created_by o user_id en la URL', async () => {
      const response = await request(app)
        .get(`/api/tickets/mine?user_id=${gerenteId}&created_by=${otroColaboradorId}`)
        .set('Authorization', `Bearer ${colaboradorToken}`);

      expect(response.statusCode).toBe(200);
      expect(ticketReadModel.getTicketsByCreator).toHaveBeenCalledWith(colaboradorId);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ticketId).toBe('t-colab-1');
    });
  });

  describe('GET /api/tickets/assigned', () => {
    beforeEach(() => {
      jest.spyOn(ticketReadModel, 'getTicketsByAssignee').mockImplementation(async (userId) => {
        if (userId === soporteId) {
          return [
            {
              ticketId: 't-assigned-1',
              title: 'Ticket asignado a Carlos',
              description: 'Detalle',
              priority: 'Alta',
              status: 'En revision',
              departmentId: deptGerenteId,
              createdAtIso: '2026-11-03T13:00:00Z',
              authorName: 'Saori',
              assignedToName: 'Carlos Soporte'
            }
          ];
        }
        return [];
      });
    });

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get('/api/tickets/assigned');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('debe responder 403 si el usuario es colaborador o gerente', async () => {
      const resColab = await request(app)
        .get('/api/tickets/assigned')
        .set('Authorization', `Bearer ${colaboradorToken}`);
      expect(resColab.statusCode).toBe(403);

      const resGerente = await request(app)
        .get('/api/tickets/assigned')
        .set('Authorization', `Bearer ${gerenteToken}`);
      expect(resGerente.statusCode).toBe(403);
    });

    it('debe responder 200 para soporte_tecnico y devolver solo sus tickets asignados', async () => {
      const response = await request(app)
        .get(`/api/tickets/assigned?assigned_to=${adminId}`)
        .set('Authorization', `Bearer ${soporteToken}`);

      expect(response.statusCode).toBe(200);
      expect(ticketReadModel.getTicketsByAssignee).toHaveBeenCalledWith(soporteId);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ticketId).toBe('t-assigned-1');
    });

    it('debe responder 200 para administrador', async () => {
      const response = await request(app)
        .get('/api/tickets/assigned')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(ticketReadModel.getTicketsByAssignee).toHaveBeenCalledWith(adminId);
    });
  });

  describe('GET /api/tickets/department', () => {
    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get('/api/tickets/department');

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('debe responder 403 si el usuario es colaborador', async () => {
      const response = await request(app)
        .get('/api/tickets/department')
        .set('Authorization', `Bearer ${colaboradorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });

    it('debe responder 400 si el query param department_id no es un UUID válido', async () => {
      const response = await request(app)
        .get('/api/tickets/department?department_id=no-es-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'El ID del departamento debe ser un UUID válido'
          })
        ])
      );
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).delete(`/api/tickets/${validTicketId}`);

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Token no proporcionado/i);
    });

    it('debe responder 403 si el usuario tiene rol sin permiso (ej. colaborador)', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${validTicketId}`)
        .set('Authorization', `Bearer ${colaboradorToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/No tienes permisos/i);
    });

    it('debe responder 400 si el parámetro id no es un UUID válido', async () => {
      const response = await request(app)
        .delete('/api/tickets/id-no-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'El ID del ticket debe ser un UUID válido'
          })
        ])
      );
    });
  });

  describe('PATCH /api/tickets/:id/status', () => {
    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .send({ status: 'En revision' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/Token no proporcionado/i);
    });

    it('debe responder 403 si el usuario tiene rol sin permiso (ej. colaborador)', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send({ status: 'En revision' });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/No tienes permisos/i);
    });

    it('debe responder 400 si el parámetro id no es un UUID válido', async () => {
      const response = await request(app)
        .patch('/api/tickets/id-invalido/status')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ status: 'En revision' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'El ID del ticket debe ser un UUID válido'
          })
        ])
      );
    });

    it('debe responder 400 si el body no incluye el campo status', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'El estado es obligatorio'
          })
        ])
      );
    });

    it('debe permitir a soporte_tecnico cambiar a Resuelto su ticket asignado con comentario (200)', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'En progreso',
        assigned_to: soporteId,
        department_id: deptGerenteId
      });
      jest.spyOn(ticketRepository, 'updateStatus').mockResolvedValue({
        id: validTicketId,
        previousStatus: 'En progreso',
        status: 'Resuelto'
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${soporteToken}`)
        .send({ status: 'Resuelto', comment: 'Falla corregida en sitio' });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.status).toBe('Resuelto');
    });

    it('debe responder 403 si soporte_tecnico intenta cambiar un ticket no asignado a él', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        assigned_to: null,
        department_id: deptGerenteId
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${soporteToken}`)
        .send({ status: 'En revision' });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toMatch(/no tienes asignado/i);
    });

    it('debe responder 403 si soporte_tecnico intenta cambiar a Cerrado o Rechazado', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'En revision',
        assigned_to: soporteId,
        department_id: deptGerenteId
      });

      const resCerrado = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${soporteToken}`)
        .send({ status: 'Cerrado', comment: 'Intento cerrar' });

      expect(resCerrado.statusCode).toBe(403);

      const resRechazado = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${soporteToken}`)
        .send({ status: 'Rechazado', comment: 'Intento rechazar' });

      expect(resRechazado.statusCode).toBe(403);
    });

    it('debe permitir al gerente rechazar un ticket de su departamento desde Abierto con comentario (200)', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        department_id: deptGerenteId
      });
      jest.spyOn(ticketRepository, 'updateStatus').mockResolvedValue({
        id: validTicketId,
        previousStatus: 'Abierto',
        status: 'Rechazado'
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ status: 'Rechazado', comment: 'Fuera del alcance del área' });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual({
        id: validTicketId,
        previousStatus: 'Abierto',
        status: 'Rechazado'
      });
    });

    it('debe responder 400 si el gerente intenta rechazar un ticket sin comentario', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        department_id: deptGerenteId
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ status: 'Rechazado' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('El comentario es obligatorio para rechazar el ticket');
    });

    it('debe responder 409 si se intenta rechazar un ticket en estado En progreso', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'En progreso',
        department_id: deptGerenteId
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/status`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ status: 'Rechazado', comment: 'Intento tardío' });

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe(
        'No se permite la transición de estado de "En progreso" a "Rechazado"'
      );
    });
  });

  describe('PATCH /api/tickets/:id/assign', () => {
    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .send({ assigned_to: soporteId });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('debe responder 403 si el rol es colaborador o soporte_tecnico', async () => {
      const resColab = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send({ assigned_to: soporteId });

      expect(resColab.statusCode).toBe(403);

      const resSoporte = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${soporteToken}`)
        .send({ assigned_to: soporteId });

      expect(resSoporte.statusCode).toBe(403);
    });

    it('debe responder 400 si el parámetro :id o el body assigned_to no son UUID válidos', async () => {
      const resBadId = await request(app)
        .patch('/api/tickets/no-uuid/assign')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: soporteId });

      expect(resBadId.statusCode).toBe(400);

      const resBadAssignee = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: 'no-es-uuid' });

      expect(resBadAssignee.statusCode).toBe(400);
    });

    it('debe responder 404 si el ticket no existe', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: soporteId });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Ticket no encontrado');
    });

    it('debe responder 403 si el gerente intenta asignar un ticket de otro departamento', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        department_id: otroDeptId,
        assigned_to: null
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: soporteId });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toMatch(/otro departamento/i);
    });

    it('debe responder 409 si el ticket está Cerrado o Rechazado', async () => {
      for (const terminalStatus of ['Cerrado', 'Rechazado']) {
        jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
          id: validTicketId,
          status: terminalStatus,
          department_id: deptGerenteId,
          assigned_to: null
        });

        const response = await request(app)
          .patch(`/api/tickets/${validTicketId}/assign`)
          .set('Authorization', `Bearer ${gerenteToken}`)
          .send({ assigned_to: soporteId });

        expect(response.statusCode).toBe(409);
        expect(response.body.message).toBe(
          `No se puede asignar un ticket en estado "${terminalStatus}"`
        );
      }
    });

    it('debe responder 400 si el usuario asignado no tiene el rol soporte_tecnico', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        department_id: deptGerenteId,
        assigned_to: null
      });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: colaboradorId });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/soporte_tecnico/i);
    });

    it('debe responder 200 con { id } cuando el gerente asigna a un soporte_tecnico de su departamento', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        status: 'Abierto',
        department_id: deptGerenteId,
        assigned_to: null
      });
      jest.spyOn(ticketRepository, 'assign').mockResolvedValue({ id: validTicketId });

      const response = await request(app)
        .patch(`/api/tickets/${validTicketId}/assign`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ assigned_to: soporteId });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Ticket asignado exitosamente',
        data: { id: validTicketId }
      });
    });
  });

  describe('GET /api/users/solvers', () => {
    beforeEach(() => {
      jest.spyOn(userReadModel, 'getSolversByDepartment').mockResolvedValue([
        { id: soporteId, fullName: 'Carlos Soporte' }
      ]);
    });

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get('/api/users/solvers');
      expect(response.statusCode).toBe(401);
    });

    it('debe responder 403 para colaborador o soporte_tecnico', async () => {
      const resColab = await request(app)
        .get('/api/users/solvers')
        .set('Authorization', `Bearer ${colaboradorToken}`);
      expect(resColab.statusCode).toBe(403);

      const resSoporte = await request(app)
        .get('/api/users/solvers')
        .set('Authorization', `Bearer ${soporteToken}`);
      expect(resSoporte.statusCode).toBe(403);
    });

    it('debe responder 200 para gerente usando su department_id e ignorando el query param', async () => {
      const response = await request(app)
        .get(`/api/users/solvers?department_id=${otroDeptId}`)
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(response.statusCode).toBe(200);
      expect(userReadModel.getSolversByDepartment).toHaveBeenCalledWith(deptGerenteId);
      expect(response.body.data).toEqual([{ id: soporteId, fullName: 'Carlos Soporte' }]);
    });

    it('debe responder 400 para administrador si no envía department_id o no es UUID', async () => {
      const resMissing = await request(app)
        .get('/api/users/solvers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resMissing.statusCode).toBe(400);

      const resInvalid = await request(app)
        .get('/api/users/solvers?department_id=invalido')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resInvalid.statusCode).toBe(400);
    });

    it('debe responder 200 para administrador cuando envía department_id válido', async () => {
      const response = await request(app)
        .get(`/api/users/solvers?department_id=${deptGerenteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(userReadModel.getSolversByDepartment).toHaveBeenCalledWith(deptGerenteId);
      expect(response.body.data).toEqual([{ id: soporteId, fullName: 'Carlos Soporte' }]);
    });
  });

  describe('POST /api/tickets/:id/attachments', () => {
    const validPayload = {
      file_url: `ticket-attachments/${validTicketId}/evidencia.png`,
      file_format: 'png',
      size_bytes: 256000
    };

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .send(validPayload);

      expect(response.statusCode).toBe(401);
    });

    it('debe responder 400 si file_url, file_format o size_bytes son inválidos', async () => {
      const resBadUrl = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send({ ...validPayload, file_url: 'https://externo.com/archivo.png' });
      expect(resBadUrl.statusCode).toBe(400);

      const resBadFormat = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send({ ...validPayload, file_format: 'exe' });
      expect(resBadFormat.statusCode).toBe(400);

      const resBadSize = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send({ ...validPayload, size_bytes: 6000000 });
      expect(resBadSize.statusCode).toBe(400);
    });

    it('debe responder 404 si el ticket no existe', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Ticket no encontrado');
    });

    it('debe responder 403 si un colaborador intenta adjuntar a un ticket creado por otro usuario', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        created_by: otroColaboradorId,
        department_id: deptGerenteId
      });

      const response = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${colaboradorToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toMatch(/no creaste/i);
    });

    it('debe responder 403 si un gerente intenta adjuntar a un ticket de otro departamento', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        created_by: otroColaboradorId,
        department_id: otroDeptId
      });

      const response = await request(app)
        .post(`/api/tickets/${validTicketId}/attachments`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send(validPayload);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toMatch(/otro departamento/i);
    });

    it('debe responder 201 cuando el colaborador creador, gerente del departamento o administrador adjuntan evidencia', async () => {
      jest.spyOn(ticketRepository, 'findById').mockResolvedValue({
        id: validTicketId,
        created_by: colaboradorId,
        department_id: deptGerenteId
      });
      jest.spyOn(ticketRepository, 'addAttachment').mockResolvedValue({
        id: 'att-created-1'
      });

      for (const token of [colaboradorToken, gerenteToken, adminToken]) {
        const response = await request(app)
          .post(`/api/tickets/${validTicketId}/attachments`)
          .set('Authorization', `Bearer ${token}`)
          .send(validPayload);

        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
          success: true,
          message: 'Evidencia adjuntada exitosamente',
          data: { id: 'att-created-1' }
        });
      }
    });
  });

  describe('GET /api/tickets/:id (detalle con URLs firmadas)', () => {
    const baseDetail = {
      ticketId: validTicketId,
      title: 'Falla en impresora',
      description: 'No enciende',
      priority: 'Alta',
      status: 'En progreso',
      departmentId: deptGerenteId,
      createdBy: colaboradorId,
      assignedTo: soporteId,
      resolutionNotes: null,
      resolvedAtIso: null,
      createdAtIso: '2026-11-03T12:00:00Z',
      updatedAtIso: '2026-11-03T13:00:00Z',
      authorName: 'Saori',
      assignedToName: 'Carlos Soporte'
    };

    const signedAttachments = [
      {
        id: 'att-1',
        fileFormat: 'png',
        sizeBytes: 245760,
        createdAtIso: '2026-11-03T12:05:00Z',
        signedUrl: 'https://placeholder.supabase.co/storage/v1/object/sign/ticket-attachments/captura.png?token=abc'
      }
    ];

    it('debe responder 401 si no se envía token', async () => {
      const response = await request(app).get(`/api/tickets/${validTicketId}`);
      expect(response.statusCode).toBe(401);
    });

    it('debe responder 400 si :id no es un UUID válido', async () => {
      const response = await request(app)
        .get('/api/tickets/no-es-uuid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.statusCode).toBe(400);
    });

    it('debe responder 404 si el ticket no existe', async () => {
      jest.spyOn(ticketReadModel, 'getTicketById').mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/tickets/${validTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Ticket no encontrado');
    });

    it('debe responder 403 si el usuario no tiene permiso sobre el ticket', async () => {
      jest.spyOn(ticketReadModel, 'getTicketById').mockResolvedValue({
        ...baseDetail,
        createdBy: otroColaboradorId,
        assignedTo: null,
        departmentId: otroDeptId
      });

      for (const token of [colaboradorToken, soporteToken, gerenteToken]) {
        const response = await request(app)
          .get(`/api/tickets/${validTicketId}`)
          .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(403);
      }
    });

    it('debe responder 200 con detalle y attachments firmados para creador, soporte asignado, gerente del depto y admin', async () => {
      jest.spyOn(ticketReadModel, 'getTicketById').mockResolvedValue(baseDetail);
      jest.spyOn(ticketReadModel, 'getAttachmentsWithSignedUrls').mockResolvedValue(signedAttachments);

      for (const token of [colaboradorToken, soporteToken, gerenteToken, adminToken]) {
        const response = await request(app)
          .get(`/api/tickets/${validTicketId}`)
          .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          success: true,
          message: 'Detalle del ticket obtenido exitosamente',
          data: {
            ...baseDetail,
            attachments: signedAttachments
          }
        });
      }
    });
  });
});
