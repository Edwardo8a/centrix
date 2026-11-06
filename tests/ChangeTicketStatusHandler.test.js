const ChangeTicketStatusHandler = require('../src/commands/tickets/ChangeTicketStatusHandler');
const ChangeTicketStatusCommand = require('../src/commands/tickets/ChangeTicketStatusCommand');
const BusinessError = require('../src/exceptions/BusinessError');
const UserRole = require('../src/enums/UserRole');

describe('ChangeTicketStatusHandler', () => {
  let mockTicketRepository;
  let handler;

  beforeEach(() => {
    mockTicketRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn()
    };
    handler = new ChangeTicketStatusHandler({ ticketRepository: mockTicketRepository });
  });

  it('debe actualizar el estado exitosamente en una transición válida (administrador)', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    const userId = 'u-admin-1';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: 'dept-1'
    });

    mockTicketRepository.updateStatus.mockResolvedValue({
      id: ticketId,
      previousStatus: 'Abierto',
      status: 'En revision'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'En revision',
      comment: 'Iniciando revision',
      userId,
      userRole: UserRole.ADMINISTRADOR
    });

    const result = await handler.handle(command);

    expect(result).toEqual({
      id: ticketId,
      previousStatus: 'Abierto',
      status: 'En revision'
    });
    expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith({
      ticketId,
      userId,
      newStatus: 'En revision',
      previousStatus: 'Abierto',
      comment: 'Iniciando revision'
    });
  });

  it('debe permitir al gerente cambiar estado si el ticket pertenece a su departamento', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: 'dept-gerente'
    });

    mockTicketRepository.updateStatus.mockResolvedValue({
      id: ticketId,
      previousStatus: 'Abierto',
      status: 'En revision'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'En revision',
      comment: 'Revision gerente',
      userId: 'u-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-gerente'
    });

    const result = await handler.handle(command);
    expect(result.status).toBe('En revision');
  });

  it('debe lanzar BusinessError 403 si el gerente no tiene departamento asignado', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: 'dept-1'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'En revision',
      comment: null,
      userId: 'u-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: null
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El gerente no tiene un departamento asignado',
      statusCode: 403
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 (anti-IDOR) si el gerente intenta cambiar un ticket de otro departamento', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: 'dept-otro'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'En revision',
      comment: null,
      userId: 'u-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-mio'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No tienes permisos para modificar tickets de otro departamento',
      statusCode: 403
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe permitir a soporte_tecnico pasar su ticket asignado a En revision, En progreso o Resuelto (con comentario)', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    const techId = 'tech-user-1';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'En progreso',
      assigned_to: techId,
      department_id: 'dept-1'
    });
    mockTicketRepository.updateStatus.mockResolvedValue({
      id: ticketId,
      previousStatus: 'En progreso',
      status: 'Resuelto'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'Resuelto',
      comment: 'Se reemplazó el cable de red',
      userId: techId,
      userRole: UserRole.SOPORTE_TECNICO,
      userDepartmentId: 'dept-1'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({
      id: ticketId,
      previousStatus: 'En progreso',
      status: 'Resuelto'
    });
    expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith({
      ticketId,
      userId: techId,
      newStatus: 'Resuelto',
      previousStatus: 'En progreso',
      comment: 'Se reemplazó el cable de red'
    });
  });

  it('debe lanzar BusinessError 403 si soporte_tecnico intenta cambiar el estado de un ticket no asignado a él', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      assigned_to: 'otro-tech-id',
      department_id: 'dept-1'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'En revision',
      comment: 'Intento sin asignación',
      userId: 'tech-user-1',
      userRole: UserRole.SOPORTE_TECNICO,
      userDepartmentId: 'dept-1'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No tienes permisos para cambiar el estado de un ticket que no tienes asignado',
      statusCode: 403
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 si soporte_tecnico intenta pasar el ticket a Cerrado', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    const techId = 'tech-user-1';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Resuelto',
      assigned_to: techId,
      department_id: 'dept-1'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'Cerrado',
      comment: 'Cierre por soporte',
      userId: techId,
      userRole: UserRole.SOPORTE_TECNICO,
      userDepartmentId: 'dept-1'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El rol soporte_tecnico no tiene permisos para cambiar el ticket al estado "Cerrado"',
      statusCode: 403
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si se pasa a Resuelto sin comentario obligatorio', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'En progreso',
      assigned_to: 'tech-1',
      department_id: 'dept-1'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'Resuelto',
      comment: '   ',
      userId: 'tech-1',
      userRole: UserRole.SOPORTE_TECNICO,
      userDepartmentId: 'dept-1'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El comentario es obligatorio para marcar el ticket como Resuelto',
      statusCode: 400
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si el estado solicitado es inválido', async () => {
    const command = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'EstadoInexistente',
      comment: null,
      userId: 'u1'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'Estado de ticket no válido',
      statusCode: 400
    });
    expect(mockTicketRepository.findById).not.toHaveBeenCalled();
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 404 si el ticket no existe o está eliminado', async () => {
    mockTicketRepository.findById.mockResolvedValue(null);

    const command = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'En revision',
      comment: null,
      userId: 'u1'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'Ticket no encontrado',
      statusCode: 404
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 409 si el nuevo estado es idéntico al actual', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      status: 'Abierto'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'abierto',
      comment: null,
      userId: 'u1'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'El ticket ya se encuentra en ese estado',
      statusCode: 409
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 409 si la transición no está permitida en la matriz', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      status: 'Abierto'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'Resuelto',
      comment: 'Solucionado directo',
      userId: 'u1'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'No se permite la transición de estado de "Abierto" a "Resuelto"',
      statusCode: 409
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 409 si se intenta transicionar desde un estado terminal Cerrado', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      status: 'Cerrado'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'En progreso',
      comment: 'Reabrir',
      userId: 'u1'
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'No se permite la transición de estado de "Cerrado" a "En progreso"',
      statusCode: 409
    });
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 400 si se transiciona a Cerrado sin comentario obligatorio', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      status: 'Abierto'
    });

    const commandSinComentario = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'Cerrado',
      comment: '',
      userId: 'u1'
    });

    await expect(handler.handle(commandSinComentario)).rejects.toThrow(BusinessError);
    await expect(handler.handle(commandSinComentario)).rejects.toMatchObject({
      message: 'El comentario es obligatorio para cerrar el ticket',
      statusCode: 400
    });

    const commandComentarioNull = new ChangeTicketStatusCommand({
      ticketId: '325cc46a-6a58-4d6a-a76b-911f13afd5c6',
      newStatus: 'Cerrado',
      comment: null,
      userId: 'u1'
    });

    await expect(handler.handle(commandComentarioNull)).rejects.toThrow(BusinessError);
    expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe permitir transicionar a Cerrado cuando se proporciona el comentario obligatorio', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto'
    });
    mockTicketRepository.updateStatus.mockResolvedValue({
      id: ticketId,
      previousStatus: 'Abierto',
      status: 'Cerrado'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'Cerrado',
      comment: 'Rechazado por ser duplicado',
      userId: 'u1'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({
      id: ticketId,
      previousStatus: 'Abierto',
      status: 'Cerrado'
    });
    expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith({
      ticketId,
      userId: 'u1',
      newStatus: 'Cerrado',
      previousStatus: 'Abierto',
      comment: 'Rechazado por ser duplicado'
    });
  });

  it('debe verificar que se invoque el repositorio para registrar historial al pasar a Resuelto', async () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'En revision'
    });
    mockTicketRepository.updateStatus.mockResolvedValue({
      id: ticketId,
      previousStatus: 'En revision',
      status: 'Resuelto'
    });

    const command = new ChangeTicketStatusCommand({
      ticketId,
      newStatus: 'Resuelto',
      comment: 'Solución implementada con éxito',
      userId: 'tech-user-1'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({
      id: ticketId,
      previousStatus: 'En revision',
      status: 'Resuelto'
    });
    expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith({
      ticketId,
      userId: 'tech-user-1',
      newStatus: 'Resuelto',
      previousStatus: 'En revision',
      comment: 'Solución implementada con éxito'
    });
  });

  describe('Fase 4: Rechazar ticket (estado Rechazado)', () => {
    const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';

    it('debe permitir rechazar un ticket desde Abierto con comentario obligatorio (gerente de su departamento)', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'Abierto',
        department_id: 'dept-regina'
      });
      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        previousStatus: 'Abierto',
        status: 'Rechazado'
      });

      const command = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'rechazado',
        comment: 'No procede por políticas del área',
        userId: 'u-regina',
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-regina'
      });

      const result = await handler.handle(command);

      expect(result).toEqual({
        id: ticketId,
        previousStatus: 'Abierto',
        status: 'Rechazado'
      });
      expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith({
        ticketId,
        userId: 'u-regina',
        newStatus: 'Rechazado',
        previousStatus: 'Abierto',
        comment: 'No procede por políticas del área'
      });
    });

    it('debe permitir rechazar un ticket desde En revision con comentario obligatorio (administrador)', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'En revision',
        department_id: 'dept-1'
      });
      mockTicketRepository.updateStatus.mockResolvedValue({
        id: ticketId,
        previousStatus: 'En revision',
        status: 'Rechazado'
      });

      const command = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'Rechazado',
        comment: 'Solicitud duplicada con el folio anterior',
        userId: 'u-admin',
        userRole: UserRole.ADMINISTRADOR
      });

      const result = await handler.handle(command);

      expect(result).toEqual({
        id: ticketId,
        previousStatus: 'En revision',
        status: 'Rechazado'
      });
    });

    it('debe lanzar BusinessError 409 si se intenta rechazar desde En progreso, Resuelto o Cerrado', async () => {
      for (const invalidOrigin of ['En progreso', 'Resuelto', 'Cerrado']) {
        mockTicketRepository.findById.mockResolvedValue({
          id: ticketId,
          status: invalidOrigin,
          department_id: 'dept-1'
        });

        const command = new ChangeTicketStatusCommand({
          ticketId,
          newStatus: 'Rechazado',
          comment: 'Motivo de rechazo',
          userId: 'u-admin',
          userRole: UserRole.ADMINISTRADOR
        });

        await expect(handler.handle(command)).rejects.toMatchObject({
          name: 'BusinessError',
          message: `No se permite la transición de estado de "${invalidOrigin}" a "Rechazado"`,
          statusCode: 409
        });
      }
      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('debe lanzar BusinessError 409 si cualquier rol intenta cambiar el estado de un ticket que ya está Rechazado', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'Rechazado',
        department_id: 'dept-1'
      });

      const command = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'En revision',
        comment: 'Reabrir ticket rechazado',
        userId: 'u-admin',
        userRole: UserRole.ADMINISTRADOR
      });

      await expect(handler.handle(command)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'No se permite la transición de estado de "Rechazado" a "En revision"',
        statusCode: 409
      });
      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('debe lanzar BusinessError 400 si se intenta rechazar sin comentario o con comentario vacío', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'Abierto',
        department_id: 'dept-regina'
      });

      const commandVacio = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'Rechazado',
        comment: '   ',
        userId: 'u-regina',
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-regina'
      });

      await expect(handler.handle(commandVacio)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El comentario es obligatorio para rechazar el ticket',
        statusCode: 400
      });

      const commandNull = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'Rechazado',
        comment: null,
        userId: 'u-regina',
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-regina'
      });

      await expect(handler.handle(commandNull)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El comentario es obligatorio para rechazar el ticket',
        statusCode: 400
      });
      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('debe lanzar BusinessError 403 si un gerente intenta rechazar un ticket de otro departamento', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'Abierto',
        department_id: 'dept-ajeno'
      });

      const command = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'Rechazado',
        comment: 'Rechazo ajeno',
        userId: 'u-regina',
        userRole: UserRole.GERENTE,
        userDepartmentId: 'dept-regina'
      });

      await expect(handler.handle(command)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'No tienes permisos para modificar tickets de otro departamento',
        statusCode: 403
      });
      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('debe lanzar BusinessError 403 si soporte_tecnico intenta rechazar un ticket (incluso asignado a él)', async () => {
      mockTicketRepository.findById.mockResolvedValue({
        id: ticketId,
        status: 'En revision',
        assigned_to: 'u-soporte',
        department_id: 'dept-regina'
      });

      const command = new ChangeTicketStatusCommand({
        ticketId,
        newStatus: 'Rechazado',
        comment: 'Intento de rechazo por soporte',
        userId: 'u-soporte',
        userRole: UserRole.SOPORTE_TECNICO,
        userDepartmentId: 'dept-regina'
      });

      await expect(handler.handle(command)).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El rol soporte_tecnico no tiene permisos para cambiar el ticket al estado "Rechazado"',
        statusCode: 403
      });
      expect(mockTicketRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
