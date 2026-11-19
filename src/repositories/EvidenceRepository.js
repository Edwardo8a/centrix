const BusinessError = require('../exceptions/BusinessError');
const { DEFAULT_ATTACHMENTS_BUCKET, normalizeAttachmentFormat } = require('../commands/tickets/AddTicketAttachmentHandler');

class EvidenceRepository {
  constructor({ supabase, bucket = DEFAULT_ATTACHMENTS_BUCKET }) {
    this.supabase = supabase;
    this.bucket = bucket;
  }

  _table() {
    if (!this.supabase) throw new BusinessError('Storage no está configurado en el backend', 500);
    return this.supabase.from('ticket_attachments');
  }

  async create({ ticketId, path, mimeType, size }) {
    const { data, error } = await this._table()
      .insert([{ ticket_id: ticketId, file_url: `${this.bucket}/${path}`, file_format: normalizeAttachmentFormat(mimeType) || 'mp4', size_bytes: size }])
      .select('id, ticket_id, file_url, file_format, size_bytes, created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async findByTicketId(ticketId) {
    const { data, error } = await this._table()
      .select('id, ticket_id, file_url, file_format, size_bytes, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}

module.exports = EvidenceRepository;
