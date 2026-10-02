// Definicion de los estados del ciclo de vida de un ticket
const TicketStatus = {
  ABIERTO: 'Abierto',
  EN_REVISION: 'En revision',
  EN_PROGRESO: 'En progreso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado'
};

// Funcion utilitaria para normalizar el estado recibido desde el cliente o base de datos.
// Permite aceptar variantes como 'en_revision', 'En revisión', 'En revision', 'abierto', etc.
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

  return null;
}

// Asignar propiedades antes de congelar el objeto
TicketStatus.TicketStatus = TicketStatus;
TicketStatus.normalizeTicketStatus = normalizeTicketStatus;

module.exports = Object.freeze(TicketStatus);
