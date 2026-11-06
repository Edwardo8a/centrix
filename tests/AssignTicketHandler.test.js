const AssignTicketCommand = require('../src/commands/tickets/AssignTicketCommand');
const AssignTicketHandler = require('../src/commands/tickets/AssignTicketHandler');
const UserRole = require('../src/enums/UserRole');
const BusinessError = require('../src/exceptions/BusinessError');

describe('AssignTicketHandler', () => {
  const ticketId = '325cc46a-6a58-4d6a-a76b-911f13afd5c6';
  const deptId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const otherDeptId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const gerenteId = '22222222-2222-2222-2222-222222222222';
  const adminId = '11111111-1111-1111-1111-111111111111';
  const soporteId = '44444444-4444-4444-4444-444444444444';
  const soporte2Id = '66666666-6666-6666-6666-666666666666';

  let mockTicketRepository;
  let mockUserReadModel;
  let handler;

  beforeEach(() => {
    mockTicketRepository = {
      findById: jest.fn(),
      assign: jest.fn()
    };
    mockUserReadModel = {
      findById: jest.fn()
    };
    handler = new AssignTicketHandler({
      ticketRepository: mockTicketRepository,
      userReadModel: mockUserReadModel
    });
  });

  it('debe crear un DTO AssignTicketCommand inmutable', () => {
    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    expect(Object.isFrozen(command)).toBe(true);
    expect(command.ticketId).toBe(ticketId);
    expect(command.assignedTo).toBe(soporteId);
  });

  it('debe asignar un ticket exitosamente cuando lo ejecuta el gerente de su departamento', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: deptId,
      assigned_to: null
    });
    mockUserReadModel.findById.mockResolvedValue({
      id: soporteId,
      nombre: 'Carlos',
      apellido_pat: 'Ruiz',
      apellido_mat: '',
      department_id: deptId,
      role: UserRole.SOPORTE_TECNICO,
      roles: [UserRole.SOPORTE_TECNICO]
    });
    mockTicketRepository.assign.mockResolvedValue({ id: ticketId });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: ticketId });
    expect(mockTicketRepository.assign).toHaveBeenCalledWith({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      comment: `Ticket asignado a Carlos Ruiz (${soporteId})`
    });
  });

  it('debe permitir reasignar un ticket a otro soporte_tecnico y registrar "Ticket reasignado a"', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'En revision',
      department_id: deptId,
      assigned_to: soporteId
    });
    mockUserReadModel.findById.mockResolvedValue({
      id: soporte2Id,
      nombre: 'Elena',
      apellido_pat: 'Gomez',
      department_id: deptId,
      role: UserRole.SOPORTE_TECNICO,
      roles: [UserRole.COLABORADOR, UserRole.SOPORTE_TECNICO]
    });
    mockTicketRepository.assign.mockResolvedValue({ id: ticketId });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporte2Id,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR,
      userDepartmentId: null
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: ticketId });
    expect(mockTicketRepository.assign).toHaveBeenCalledWith({
      ticketId,
      assignedTo: soporte2Id,
      userId: adminId,
      comment: `Ticket reasignado a Elena Gomez (${soporte2Id})`
    });
  });

  it('Regla 1: debe lanzar BusinessError 404 si el ticket no existe o está eliminado', async () => {
    mockTicketRepository.findById.mockResolvedValue(null);

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR
    });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'Ticket no encontrado',
      statusCode: 404
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 2a: debe lanzar BusinessError 409 si el ticket está en estado final Cerrado', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Cerrado',
      department_id: deptId,
      assigned_to: null
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No se puede asignar un ticket en estado "Cerrado"',
      statusCode: 409
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 2b: debe lanzar BusinessError 409 si el ticket está en estado final Rechazado', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Rechazado',
      department_id: deptId,
      assigned_to: null
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No se puede asignar un ticket en estado "Rechazado"',
      statusCode: 409
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 3a: debe lanzar BusinessError 403 si el gerente no tiene departamento asignado', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: deptId,
      assigned_to: null
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: null
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El gerente no tiene un departamento asignado',
      statusCode: 403
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 3b: debe lanzar BusinessError 403 si el gerente intenta asignar un ticket de otro departamento', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: otherDeptId,
      assigned_to: null
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No tienes permisos para asignar tickets de otro departamento',
      statusCode: 403
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 4a: debe lanzar BusinessError 404 si el usuario asignado no existe', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: deptId,
      assigned_to: null
    });
    mockUserReadModel.findById.mockResolvedValue(null);

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El usuario a asignar no existe',
      statusCode: 404
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 4b: debe lanzar BusinessError 400 si el usuario asignado no pertenece al departamento del ticket', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: deptId,
      assigned_to: null
    });
    mockUserReadModel.findById.mockResolvedValue({
      id: soporteId,
      nombre: 'Carlos',
      department_id: otherDeptId,
      role: UserRole.SOPORTE_TECNICO,
      roles: [UserRole.SOPORTE_TECNICO]
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: adminId,
      userRole: UserRole.ADMINISTRADOR
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El usuario a asignar no pertenece al departamento del ticket',
      statusCode: 400
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 4c: debe lanzar BusinessError 400 si el usuario asignado no tiene el rol soporte_tecnico', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'Abierto',
      department_id: deptId,
      assigned_to: null
    });
    mockUserReadModel.findById.mockResolvedValue({
      id: soporteId,
      nombre: 'Saori',
      department_id: deptId,
      role: UserRole.COLABORADOR,
      roles: [UserRole.COLABORADOR]
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El usuario a asignar debe tener el rol de soporte_tecnico',
      statusCode: 400
    });
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });

  it('Regla 5: debe lanzar BusinessError 409 si el ticket ya está asignado al mismo usuario', async () => {
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      status: 'En progreso',
      department_id: deptId,
      assigned_to: soporteId
    });

    const command = new AssignTicketCommand({
      ticketId,
      assignedTo: soporteId,
      userId: gerenteId,
      userRole: UserRole.GERENTE,
      userDepartmentId: deptId
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El ticket ya se encuentra asignado a este usuario',
      statusCode: 409
    });
    expect(mockUserReadModel.findById).not.toHaveBeenCalled();
    expect(mockTicketRepository.assign).not.toHaveBeenCalled();
  });
});
