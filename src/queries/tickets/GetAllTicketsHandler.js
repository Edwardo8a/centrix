const { normalizeTicketStatus } = require('../../enums/TicketStatus');
const BusinessError = require('../../exceptions/BusinessError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const PRIORITY_MAP = Object.freeze({
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Critica',
  crítica: 'Critica'
});

function normalizeTicketPriority(rawPriority) {
  if (typeof rawPriority !== 'string') return null;
  return PRIORITY_MAP[rawPriority.trim().toLowerCase()] || null;
}

class GetAllTicketsHandler {
  /**
   * @param {{ ticketReadModel: import('../../contracts').ITicketReadModel }} deps
   */
  constructor({ ticketReadModel }) {
    this.ticketReadModel = ticketReadModel;
  }

  async handle(query = {}) {
    const rawPage = query.page ?? DEFAULT_PAGE;
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
      throw new BusinessError('El parámetro page debe ser un entero mayor o igual a 1', 400);
    }

    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new BusinessError(`El parámetro limit debe ser un entero entre 1 y ${MAX_LIMIT}`, 400);
    }

    let normalizedStatus = null;
    if (query.status !== null && query.status !== undefined && query.status !== '') {
      normalizedStatus = normalizeTicketStatus(query.status);
      if (!normalizedStatus) {
        throw new BusinessError('El estado proporcionado no es válido', 400);
      }
    }

    let normalizedPriority = null;
    if (query.priority !== null && query.priority !== undefined && query.priority !== '') {
      normalizedPriority = normalizeTicketPriority(query.priority);
      if (!normalizedPriority) {
        throw new BusinessError('La prioridad debe ser Baja, Media, Alta o Critica', 400);
      }
    }

    const departmentId =
      typeof query.departmentId === 'string' && query.departmentId.trim() !== ''
        ? query.departmentId.trim()
        : null;

    return await this.ticketReadModel.getAllTickets({
      status: normalizedStatus,
      departmentId,
      priority: normalizedPriority,
      page,
      limit
    });
  }
}

module.exports = GetAllTicketsHandler;
module.exports.normalizeTicketPriority = normalizeTicketPriority;
module.exports.MAX_LIMIT = MAX_LIMIT;

