const logger = require('../utils/logger');
const {
  DEFAULT_ATTACHMENTS_BUCKET,
  extractBucketObjectPath
} = require('../commands/tickets/AddTicketAttachmentHandler');

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600; // 1 hora

class StorageService {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.storageClient]
   * @param {string} [deps.bucketName]
   * @param {string} [deps.supabaseUrl]
   * @param {number} [deps.signedUrlExpiresIn]
   */
  constructor({
    storageClient = null,
    bucketName = DEFAULT_ATTACHMENTS_BUCKET,
    supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    signedUrlExpiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS
  } = {}) {
    this.storageClient = storageClient;
    this.bucketName = bucketName;
    this.supabaseUrl = supabaseUrl;
    this.signedUrlExpiresIn = signedUrlExpiresIn;
  }

  /**
   * Firma URLs de adjuntos en lote.
   * @param {Array<object>} rawAttachments
   * @returns {Promise<Array<{ id: string, fileFormat: string, sizeBytes: number, createdAtIso: string, signedUrl: string|null }>>}
   */
  async createSignedUrlsForAttachments(rawAttachments = []) {
    if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
      return [];
    }

    const sorted = [...rawAttachments].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    const itemsWithPaths = sorted.map(att => ({
      ...att,
      objectPath: extractBucketObjectPath(att.file_url, {
        bucketName: this.bucketName,
        supabaseUrl: this.supabaseUrl
      })
    }));

    const validPaths = itemsWithPaths
      .map(item => item.objectPath)
      .filter(Boolean);

    const signedUrlMap = new Map();

    if (validPaths.length > 0 && this.storageClient && this.storageClient.storage) {
      try {
        const { data: signedList, error: signError } = await this.storageClient
          .storage
          .from(this.bucketName)
          .createSignedUrls(validPaths, this.signedUrlExpiresIn);

        if (signError) {
          logger.warn('No se pudieron firmar URLs de adjuntos en Storage', { error: signError });
        } else {
          for (const entry of signedList || []) {
            if (entry && entry.path && entry.signedUrl) {
              signedUrlMap.set(entry.path, entry.signedUrl);
            }
          }
        }
      } catch (err) {
        logger.warn('Excepción al firmar URLs de adjuntos en Storage', { error: err });
      }
    }

    return itemsWithPaths.map(att => ({
      id: att.id,
      fileFormat: att.file_format,
      sizeBytes: att.size_bytes,
      createdAtIso: att.created_at,
      signedUrl: att.objectPath ? signedUrlMap.get(att.objectPath) || null : null
    }));
  }
}

module.exports = StorageService;
module.exports.DEFAULT_SIGNED_URL_TTL_SECONDS = DEFAULT_SIGNED_URL_TTL_SECONDS;
