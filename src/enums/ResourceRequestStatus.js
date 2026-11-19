const ResourceRequestStatus = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada'
};

function normalizeResourceRequestStatus(status) {
  if (!status || typeof status !== 'string') return null;

  const cleaned = status
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ');

  if (cleaned === 'pendiente') return ResourceRequestStatus.PENDIENTE;
  if (cleaned === 'aprobada') return ResourceRequestStatus.APROBADA;
  if (cleaned === 'rechazada') return ResourceRequestStatus.RECHAZADA;
  if (cleaned === 'en proceso') return ResourceRequestStatus.EN_PROCESO;
  if (cleaned === 'completada') return ResourceRequestStatus.COMPLETADA;
  if (cleaned === 'cancelada') return ResourceRequestStatus.CANCELADA;

  return null;
}

const ALLOWED_REQUEST_STATUS_TRANSITIONS = Object.freeze({
  [ResourceRequestStatus.PENDIENTE]: [
    ResourceRequestStatus.APROBADA,
    ResourceRequestStatus.RECHAZADA,
    ResourceRequestStatus.CANCELADA
  ],
  [ResourceRequestStatus.APROBADA]: [
    ResourceRequestStatus.EN_PROCESO,
    ResourceRequestStatus.CANCELADA
  ],
  [ResourceRequestStatus.EN_PROCESO]: [
    ResourceRequestStatus.COMPLETADA,
    ResourceRequestStatus.CANCELADA
  ],
  [ResourceRequestStatus.RECHAZADA]: [],
  [ResourceRequestStatus.COMPLETADA]: [],
  [ResourceRequestStatus.CANCELADA]: []
});

function isValidRequestTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_REQUEST_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

ResourceRequestStatus.ResourceRequestStatus = ResourceRequestStatus;
ResourceRequestStatus.normalizeResourceRequestStatus = normalizeResourceRequestStatus;
ResourceRequestStatus.ALLOWED_REQUEST_STATUS_TRANSITIONS = ALLOWED_REQUEST_STATUS_TRANSITIONS;
ResourceRequestStatus.isValidRequestTransition = isValidRequestTransition;

module.exports = Object.freeze(ResourceRequestStatus);
