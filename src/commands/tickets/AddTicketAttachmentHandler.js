const UserRole = require('../../enums/UserRole');
const BusinessError = require('../../exceptions/BusinessError');

const ALLOWED_ATTACHMENT_FORMATS = Object.freeze(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (5,242,880 bytes)
const DEFAULT_ATTACHMENTS_BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET || 'ticket-attachments';

const MIME_TO_FORMAT = Object.freeze({
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
});

function normalizeAttachmentFormat(rawFormat) {
  if (typeof rawFormat !== 'string') return null;
  const cleaned = rawFormat.trim().toLowerCase().replace(/^\./, '');
  if (!cleaned) return null;

  if (MIME_TO_FORMAT[cleaned]) {
    return MIME_TO_FORMAT[cleaned];
  }

  return ALLOWED_ATTACHMENT_FORMATS.includes(cleaned) ? cleaned : null;
}

function extractBucketObjectPath(
  rawFileUrl,
  {
    bucketName = DEFAULT_ATTACHMENTS_BUCKET,
    supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
  } = {}
) {
  if (typeof rawFileUrl !== 'string') return null;
  const trimmed = rawFileUrl.trim();
  if (!trimmed) return null;

  if (trimmed.includes('..') || trimmed.includes('\\') || (trimmed.includes('//') && !trimmed.startsWith('http'))) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const normalizedBase = supabaseUrl.replace(/\/+$/, '');
    const allowedPrefixes = [
      `${normalizedBase}/storage/v1/object/${bucketName}/`,
      `${normalizedBase}/storage/v1/object/authenticated/${bucketName}/`,
      `${normalizedBase}/storage/v1/object/private/${bucketName}/`,
      `${normalizedBase}/storage/v1/object/public/${bucketName}/`
    ];

    const matchedPrefix = allowedPrefixes.find(prefix => trimmed.startsWith(prefix));
    if (!matchedPrefix) return null;

    const objectPath = trimmed.slice(matchedPrefix.length);
    if (!objectPath || objectPath.startsWith('/') || objectPath.endsWith('/')) {
      return null;
    }
    return objectPath;
  }

  const bucketPrefix = `${bucketName}/`;
  if (!trimmed.startsWith(bucketPrefix)) {
    return null;
  }

  const objectPath = trimmed.slice(bucketPrefix.length);
  if (!objectPath || objectPath.startsWith('/') || objectPath.endsWith('/')) {
    return null;
  }
  return objectPath;
}

function isValidBucketFileUrl(rawFileUrl, options = {}) {
  return Boolean(extractBucketObjectPath(rawFileUrl, options));
}

class AddTicketAttachmentHandler {
  /**
   * @param {{
   *   ticketRepository: import('../../contracts').ITicketRepository,
   *   bucketName?: string,
   *   supabaseUrl?: string
   * }} deps
   */
  constructor({
    ticketRepository,
    bucketName = DEFAULT_ATTACHMENTS_BUCKET,
    supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
  }) {
    this.ticketRepository = ticketRepository;
    this.bucketName = bucketName;
    this.supabaseUrl = supabaseUrl;
  }

  async handle(command) {
    // 1. Validar formato
    const normalizedFormat = normalizeAttachmentFormat(command.fileFormat);
    if (!normalizedFormat) {
      throw new BusinessError(
        'Formato de archivo no permitido. Formatos válidos: jpg, jpeg, png, webp, pdf',
        400
      );
    }

    // 2. Validar tamaño en bytes
    const sizeBytes = Number(command.sizeBytes);
    if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new BusinessError(
        `El tamaño del archivo debe ser un entero entre 1 y ${MAX_ATTACHMENT_SIZE_BYTES} bytes (5 MB)`,
        400
      );
    }

    // 3. Validar que file_url corresponda a nuestro bucket
    if (
      !isValidBucketFileUrl(command.fileUrl, {
        bucketName: this.bucketName,
        supabaseUrl: this.supabaseUrl
      })
    ) {
      throw new BusinessError(
        'La ruta file_url no pertenece al bucket de evidencias configurado',
        400
      );
    }

    // 4. Verificar que el ticket exista y no esté eliminado
    const ticket = await this.ticketRepository.findById(command.ticketId);
    if (!ticket) {
      throw new BusinessError('Ticket no encontrado', 404);
    }

    // 5. Autorización sobre el ticket:
    // - administrador: cualquier ticket
    // - gerente: solo tickets de su departamento
    // - creador del ticket (ej. colaborador): solo tickets donde created_by === userId
    if (command.userRole === UserRole.ADMINISTRADOR) {
      // Acceso total
    } else if (command.userRole === UserRole.GERENTE) {
      if (!command.userDepartmentId) {
        throw new BusinessError('El gerente no tiene un departamento asignado', 403);
      }
      if (ticket.department_id !== command.userDepartmentId) {
        throw new BusinessError(
          'No tienes permiso para adjuntar evidencias a un ticket de otro departamento',
          403
        );
      }
    } else if (ticket.created_by !== command.userId) {
      throw new BusinessError(
        'No tienes permiso para adjuntar evidencias a un ticket que no creaste',
        403
      );
    }

    // 6. Persistir metadata del adjunto
    const created = await this.ticketRepository.addAttachment({
      ticketId: command.ticketId,
      fileUrl: command.fileUrl.trim(),
      fileFormat: normalizedFormat,
      sizeBytes
    });

    return { id: created.id };
  }
}

module.exports = AddTicketAttachmentHandler;
module.exports.ALLOWED_ATTACHMENT_FORMATS = ALLOWED_ATTACHMENT_FORMATS;
module.exports.MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_BYTES;
module.exports.DEFAULT_ATTACHMENTS_BUCKET = DEFAULT_ATTACHMENTS_BUCKET;
module.exports.normalizeAttachmentFormat = normalizeAttachmentFormat;
module.exports.extractBucketObjectPath = extractBucketObjectPath;
module.exports.isValidBucketFileUrl = isValidBucketFileUrl;
