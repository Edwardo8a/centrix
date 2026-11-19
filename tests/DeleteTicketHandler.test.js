const DeleteTicketHandler = require('../src/commands/tickets/DeleteTicketHandler');
const DeleteTicketCommand = require('../src/commands/tickets/DeleteTicketCommand');
const BusinessError = require('../src/exceptions/BusinessError');
const UserRole = require('../src/enums/UserRole');

describe('DeleteTicketHandler', () => {
  let mockTicketRepository;
  let handler;

  beforeEach(() => {
    mockTicketRepository = {
      findById: jest.fn(),
      softDelete: jest.fn()
    };
    handler = new DeleteTicketHandler({ ticketRepository: mockTicketRepository });
  });

  it('debe realizar el borrado lógico exitosamente cuando el ticket existe y no está eliminado', async () => {
    const ticketId = 'a4d5b244-6a84-48f5-bca4-d19e99a800b1';
    const userId = 'u123';

    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      title: 'Ticket de prueba',
      department_id: 'dept-1',
      deleted_at: null
    });
    mockTicketRepository.softDelete.mockResolvedValue({ id: ticketId });

    const command = new DeleteTicketCommand({
      ticketId,
      userId,
      userRole: UserRole.ADMINISTRADOR
    });
    const result = await handler.handle(command);

    expect(result).toEqual({ id: ticketId });
    expect(mockTicketRepository.findById).toHaveBeenCalledWith(ticketId);
    expect(mockTicketRepository.softDelete).toHaveBeenCalledWith(ticketId, userId);
  });

  it('debe lanzar BusinessError 404 si el ticket no existe', async () => {
    const ticketId = 'a4d5b244-6a84-48f5-bca4-d19e99a800b1';
    mockTicketRepository.findById.mockResolvedValue(null);

    const command = new DeleteTicketCommand({ ticketId, userId: 'u123' });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'Ticket no encontrado',
      statusCode: 404
    });
    expect(mockTicketRepository.softDelete).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 404 si el ticket ya se encuentra eliminado', async () => {
    const ticketId = 'a4d5b244-6a84-48f5-bca4-d19e99a800b1';
    mockTicketRepository.findById.mockResolvedValue(null);

    const command = new DeleteTicketCommand({ ticketId, userId: 'u123' });

    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toMatchObject({
      message: 'Ticket no encontrado',
      statusCode: 404
    });
    expect(mockTicketRepository.softDelete).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 si un gerente no tiene departamento asignado', async () => {
    const ticketId = 'a4d5b244-6a84-48f5-bca4-d19e99a800b1';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      department_id: 'dept-1',
      deleted_at: null
    });

    const command = new DeleteTicketCommand({
      ticketId,
      userId: 'u-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: null
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'El gerente no tiene un departamento asignado',
      statusCode: 403
    });
    expect(mockTicketRepository.softDelete).not.toHaveBeenCalled();
  });

  it('debe lanzar BusinessError 403 (anti-IDOR) si un gerente intenta eliminar un ticket de otro departamento', async () => {
    const ticketId = 'a4d5b244-6a84-48f5-bca4-d19e99a800b1';
    mockTicketRepository.findById.mockResolvedValue({
      id: ticketId,
      department_id: 'dept-ajeno',
      deleted_at: null
    });

    const command = new DeleteTicketCommand({
      ticketId,
      userId: 'u-gerente',
      userRole: UserRole.GERENTE,
      userDepartmentId: 'dept-propio'
    });

    await expect(handler.handle(command)).rejects.toMatchObject({
      name: 'BusinessError',
      message: 'No tienes permisos para eliminar tickets de otro departamento',
      statusCode: 403
    });
    expect(mockTicketRepository.softDelete).not.toHaveBeenCalled();
  });
});

