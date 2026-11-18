const logger = require('../utils/logger');
const StorageService = require('../services/StorageService');
const {
  DEFAULT_ATTACHMENTS_BUCKET
} = require('../commands/tickets/AddTicketAttachmentHandler');

const TICKET_SUMMARY_SELECT = `
  id,
  title,
  description,
  priority,
  status,
  department_id,
  created_at,
  creator:users!fk_tickets_created_by (id, full_name),
  assignee:users!fk_tickets_assigned_to (id, full_name)
`;

const TICKET_DETAIL_SELECT = `
  id,
  title,
  description,
  priority,
  status,
  department_id,
  created_by,
  assigned_to,
  resolution_notes,
  resolved_at,
  created_at,
  updated_at,
  creator:users!fk_tickets_created_by (id, full_name),
  assignee:users!fk_tickets_assigned_to (id, full_name),
  attachments:ticket_attachments (id, file_url, file_format, size_bytes, created_at)
`;

const DEFAULT_SIGNED_URL_TTL_SECONDS = 3600; // 1 hora

class TicketReadModel {
  constructor({
    supabase,
    storageService = null,
    storageClient = null,
    bucketName = DEFAULT_ATTACHMENTS_BUCKET,
    supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    signedUrlExpiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS
  }) {
    this.supabase = supabase;
    this.storageClient = storageClient || supabase;
    this.bucketName = bucketName;
    this.supabaseUrl = supabaseUrl;
    this.signedUrlExpiresIn = signedUrlExpiresIn;
    this.storageService =
      storageService ||
      new StorageService({
        storageClient: this.storageClient,
        bucketName: this.bucketName,
        supabaseUrl: this.supabaseUrl,
        signedUrlExpiresIn: this.signedUrlExpiresIn
      });
  }

  _mapTicketSummary(ticket) {
    return {
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      departmentId: ticket.department_id,
      createdAtIso: ticket.created_at,
      authorName: ticket.creator ? ticket.creator.full_name : 'Desconocido',
      assignedToName: ticket.assignee ? ticket.assignee.full_name : 'Sin asignar'
    };
  }

  async getTicketsByDepartment(departmentId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(TICKET_SUMMARY_SELECT)
      .eq('department_id', departmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        logger.error('Ambiguous relation detected', { error });
      }
      throw error;
    }

    return data.map(ticket => this._mapTicketSummary(ticket));
  }

  async getTicketsByCreator(userId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(TICKET_SUMMARY_SELECT)
      .eq('created_by', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        logger.error('Ambiguous relation detected', { error });
      }
      throw error;
    }

    return data.map(ticket => this._mapTicketSummary(ticket));
  }

  async getTicketsByAssignee(userId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(TICKET_SUMMARY_SELECT)
      .eq('assigned_to', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        logger.error('Ambiguous relation detected', { error });
      }
      throw error;
    }

    return data.map(ticket => this._mapTicketSummary(ticket));
  }

  async getAllTickets({ status = null, departmentId = null, priority = null, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabase
      .from('tickets')
      .select(TICKET_SUMMARY_SELECT, { count: 'exact' })
      .is('deleted_at', null);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (departmentId) {
      queryBuilder = queryBuilder.eq('department_id', departmentId);
    }

    if (priority) {
      queryBuilder = queryBuilder.eq('priority', priority);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        logger.error('Ambiguous relation detected', { error });
      }
      throw error;
    }

    const total = count ?? 0;

    return {
      items: (data || []).map(ticket => this._mapTicketSummary(ticket)),
      pagination: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    };
  }

  async getTicketById(ticketId) {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(TICKET_DETAIL_SELECT)
      .eq('id', ticketId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST201' || (error.message && error.message.includes('ambiguous'))) {
        logger.error('Ambiguous relation detected', { error });
      }
      throw error;
    }

    if (!data) return null;

    const mapped = {
      ticketId: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      departmentId: data.department_id,
      createdBy: data.created_by,
      assignedTo: data.assigned_to ?? null,
      resolutionNotes: data.resolution_notes ?? null,
      resolvedAtIso: data.resolved_at ?? null,
      createdAtIso: data.created_at,
      updatedAtIso: data.updated_at ?? null,
      authorName: data.creator ? data.creator.full_name : 'Desconocido',
      assignedToName: data.assignee ? data.assignee.full_name : 'Sin asignar'
    };

    if (Array.isArray(data.attachments)) {
      Object.defineProperty(mapped, '_rawAttachments', {
        value: data.attachments,
        enumerable: false,
        configurable: true
      });
    }

    return mapped;
  }

  async signAttachments(rawAttachments = []) {
    return await this.storageService.createSignedUrlsForAttachments(rawAttachments);
  }

  async getAttachmentsWithSignedUrls(ticketId) {
    const { data, error } = await this.supabase
      .from('ticket_attachments')
      .select('id, file_url, file_format, size_bytes, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return await this.signAttachments(data);
  }
}

module.exports = TicketReadModel;
