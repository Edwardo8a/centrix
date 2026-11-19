class GetTicketEvidencesQuery {
  constructor({ ticketRepository, evidenceRepository, fileStorageService, accessPolicy }) {
    this.ticketRepository = ticketRepository;
    this.evidenceRepository = evidenceRepository;
    this.fileStorageService = fileStorageService;
    this.accessPolicy = accessPolicy;
  }

  async execute({ ticketId, user }) {
    const ticket = await this.ticketRepository.findById(ticketId);
    this.accessPolicy.assertCanAccess(ticket, user);
    const rows = await this.evidenceRepository.findByTicketId(ticketId);
    return Promise.all(rows.map(async row => ({
      evidenceId: row.id,
      ticketId: row.ticket_id,
      mimeType: ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', webp: 'image/webp', pdf: 'application/pdf' })[row.file_format] || row.file_format,
      size: row.size_bytes,
      createdAt: row.created_at,
      signedUrl: await this.fileStorageService.signedUrl(row.file_url)
    })));
  }
}

module.exports = GetTicketEvidencesQuery;
