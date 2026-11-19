const { randomUUID } = require('crypto');
const { Buffer } = require('buffer');
const BusinessError = require('../../exceptions/BusinessError');
const { MAX_EVIDENCE_BYTES } = require('../../config/multer');

const extensions = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'video/mp4': 'mp4' });

function matchesContent(file) {
  const bytes = file.buffer;
  if (!Buffer.isBuffer(bytes)) return false;
  if (file.mimetype === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  return file.mimetype === 'video/mp4' && bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp';
}

class AttachTicketEvidenceHandler {
  constructor({ ticketRepository, evidenceRepository, fileStorageService, accessPolicy }) {
    this.ticketRepository = ticketRepository;
    this.evidenceRepository = evidenceRepository;
    this.fileStorageService = fileStorageService;
    this.accessPolicy = accessPolicy;
  }

  async handle({ ticketId, user, file }) {
    if (!file) throw new BusinessError('Selecciona un archivo de evidencia', 400);
    const ticket = await this.ticketRepository.findById(ticketId);
    this.accessPolicy.assertCanAccess(ticket, user, { forUpload: true });
    if (!extensions[file.mimetype] || !matchesContent(file)) {
      throw new BusinessError('El archivo no corresponde a un JPEG, PNG o MP4 válido', 400);
    }
    if (file.size > MAX_EVIDENCE_BYTES) throw new BusinessError('El archivo supera 5 MB', 413);

    const path = `tickets/${ticketId}/${randomUUID()}.${extensions[file.mimetype]}`;
    await this.fileStorageService.upload(path, file.buffer, file.mimetype);
    try {
      const signedUrl = await this.fileStorageService.signedUrl(path);
      const row = await this.evidenceRepository.create({
        ticketId, path, mimeType: file.mimetype, size: file.size
      });
      return {
        evidenceId: row.id,
        ticketId: row.ticket_id,
        mimeType: file.mimetype,
        size: row.size_bytes,
        createdAt: row.created_at,
        signedUrl
      };
    } catch (error) {
      try {
        await this.fileStorageService.remove(path);
      } catch (cleanupError) {
        console.error('[Evidence] No se pudo retirar el archivo sin registro:', cleanupError);
      }
      throw error;
    }
  }
}

module.exports = AttachTicketEvidenceHandler;
