const BusinessError = require('../exceptions/BusinessError');
const { DEFAULT_ATTACHMENTS_BUCKET, extractBucketObjectPath } = require('../commands/tickets/AddTicketAttachmentHandler');

// Older evidence rows stored tickets/... without the bucket prefix.
function evidenceObjectPath(path, options = {}) {
  const qualified = extractBucketObjectPath(path, options);
  if (qualified) return qualified;
  return typeof path === 'string' && /^tickets\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|mp4|webp|pdf)$/.test(path)
    ? path : null;
}

class FileStorageService {
  constructor({ supabase, bucket = DEFAULT_ATTACHMENTS_BUCKET }) {
    this.supabase = supabase;
    this.bucket = bucket;
  }

  _storage() {
    if (!this.supabase) throw new BusinessError('Storage no está configurado en el backend', 500);
    return this.supabase.storage.from(this.bucket);
  }

  async upload(path, buffer, mimeType) {
    const { error } = await this._storage().upload(path, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) throw error;
  }

  async signedUrl(path) {
    const objectPath = evidenceObjectPath(path, { bucketName: this.bucket });
    if (!objectPath) throw new BusinessError('Ruta de evidencia no válida', 400);
    const { data, error } = await this._storage().createSignedUrl(objectPath, 300);
    if (error) throw error;
    return data.signedUrl;
  }

  async remove(path) {
    const { error } = await this._storage().remove([path]);
    if (error) throw error;
  }
}

module.exports = FileStorageService;
module.exports.evidenceObjectPath = evidenceObjectPath;
