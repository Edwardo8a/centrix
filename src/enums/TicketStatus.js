// Definicion de los estados del ciclo de vida de un ticket
const TicketStatus = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revision',
  EN_PROGRESO: 'En progreso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  RECHAZADO: 'Rechazado'
};

// Funcion utilitaria para normalizar el estado recibido desde el cliente o base de datos.
// Permite aceptar variantes como 'en_revision', 'En revisión', 'En revision', 'abierto', 'rechazado', etc.
function normalizeTicketStatus(status) {
  if (!status || typeof status !== 'string') {
    return null;
  }

  const cleaned = status
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ');

  if (cleaned === 'abierto') return TicketStatus.ABIERTO;
  if (cleaned === 'en revision') return TicketStatus.EN_REVISION;
  if (cleaned === 'en progreso') return TicketStatus.EN_PROGRESO;
  if (cleaned === 'resuelto') return TicketStatus.RESUELTO;
  if (cleaned === 'cerrado') return TicketStatus.CERRADO;
  if (cleaned === 'rechazado') return TicketStatus.RECHAZADO;

  return null;
}

// Matriz centralizada de transiciones permitidas para el ciclo de vida del ticket
const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [TicketStatus.ABIERTO]: [
    TicketStatus.EN_REVISION,
    TicketStatus.EN_PROGRESO,
    TicketStatus.CERRADO,
    TicketStatus.RECHAZADO
  ],
  [TicketStatus.EN_REVISION]: [
    TicketStatus.EN_PROGRESO,
    TicketStatus.RESUELTO,
    TicketStatus.CERRADO,
    TicketStatus.RECHAZADO
  ],
  [TicketStatus.EN_PROGRESO]: [
    TicketStatus.EN_REVISION,
    TicketStatus.RESUELTO,
    TicketStatus.CERRADO
  ],
  [TicketStatus.RESUELTO]: [
    TicketStatus.EN_PROGRESO,
    TicketStatus.CERRADO
  ],
  [TicketStatus.CERRADO]: [],
  [TicketStatus.RECHAZADO]: []
});

function isValidTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(targetStatus);
}

// Asignar propiedades antes de congelar el objeto
TicketStatus.TicketStatus = TicketStatus;
TicketStatus.normalizeTicketStatus = normalizeTicketStatus;
TicketStatus.ALLOWED_STATUS_TRANSITIONS = ALLOWED_STATUS_TRANSITIONS;
TicketStatus.isValidTransition = isValidTransition;

module.exports = Object.freeze(TicketStatus);
