const supabase = require('../../../infrastructure/db/supabaseClient');
const Ticket = require('../../../core/entities/Ticket');

class CreateTicketCommand {
  constructor({ ticketRepository, auditService }) {
    this.ticketRepository = ticketRepository;
    this.auditService = auditService;
  }

  async execute({ Titulo, Descripcion, Prioridad, id_departamento, userId }) {
    // La entidad de Ticket recibe los parametros que son necesarios para la base de datos
    const ticketEntity = new Ticket({ Titulo, Descripcion, Prioridad, id_departamento, createdBy: userId });

    // Intenta ejecutar vía función almacenada RPC para garantizar ACID estricto
    try {
      const { data, error } = await supabase.rpc('create_ticket_transaction', {
        p_Titulo: ticketEntity.Titulo,
        p_Descripcion: ticketEntity.Descripcion,
        p_Prioridad: ticketEntity.Prioridad,
        p_id_departamento: ticketEntity.id_departamento,
        p_id_creador: userId
      });


      if (!error && data) return data;
    } catch (rpcErr) {
      console.warn('[CreateTicketCommand] RPC call fallback to repository:', rpcErr.message);
    }

    // Fallback a repositorio + servicio de auditoría
    const createdTicket = await this.ticketRepository.create({
      titulo: ticketEntity.Titulo,
      descripcion: ticketEntity.Descripcion,
      prioridad: ticketEntity.Prioridad,
      id_departamento: ticketEntity.id_departamento,
      id_creador: userId
    });

    if (this.auditService) {
      await this.auditService.logAction(userId, 'CREATE_TICKET', 'tickets', createdTicket.id);
    }

    return createdTicket;
  }
}

module.exports = CreateTicketCommand;
