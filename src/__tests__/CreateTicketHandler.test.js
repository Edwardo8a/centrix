const CreateTicketHandler = require('../commands/tickets/CreateTicketHandler');
const CreateTicketCommand = require('../commands/tickets/CreateTicketCommand');
const ValidationError = require('../exceptions/ValidationError');

describe('CreateTicketHandler', () => {
  let mockTicketRepository;
  let handler;

  beforeEach(() => {
    mockTicketRepository = {
      create: jest.fn()
    };
    handler = new CreateTicketHandler({ ticketRepository: mockTicketRepository });
  });

  it('debe devolver el id del ticket cuando todo es válido', async () => {
    mockTicketRepository.create.mockResolvedValue({ id: '123' });

    const command = new CreateTicketCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      priority: 'Alta',
      departmentId: 'dept-1',
      userId: 'user-1'
    });

    const result = await handler.handle(command);

    expect(result).toEqual({ id: '123' });
    expect(mockTicketRepository.create).toHaveBeenCalledTimes(1);
    
    const savedTicket = mockTicketRepository.create.mock.calls[0][0];
    expect(savedTicket.title).toBe('Título válido');
    expect(savedTicket.status).toBe('Abierto');
  });

  it('debe lanzar ValidationError y no llamar al repositorio si la prioridad es inválida', async () => {
    const command = new CreateTicketCommand({
      title: 'Título válido',
      description: 'Descripción válida',
      priority: 'Invalida',
      departmentId: 'dept-1',
      userId: 'user-1'
    });

    await expect(handler.handle(command)).rejects.toThrow(ValidationError);
    expect(mockTicketRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar ValidationError y no llamar al repositorio si falta el título', async () => {
    const command = new CreateTicketCommand({
      title: '',
      description: 'Descripción válida',
      priority: 'Media',
      departmentId: 'dept-1',
      userId: 'user-1'
    });

    await expect(handler.handle(command)).rejects.toThrow(ValidationError);
    expect(mockTicketRepository.create).not.toHaveBeenCalled();
  });

  it('debe lanzar ValidationError y no llamar al repositorio si falta el creador', async () => {
    const command = new CreateTicketCommand({
      title: 'Título',
      description: 'Descripción',
      priority: 'Media',
      departmentId: 'dept-1',
      userId: null
    });

    await expect(handler.handle(command)).rejects.toThrow(ValidationError);
    expect(mockTicketRepository.create).not.toHaveBeenCalled();
  });
});
