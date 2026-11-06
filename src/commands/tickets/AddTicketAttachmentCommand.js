class AddTicketAttachmentCommand {
  constructor({
    ticketId,
    fileUrl,
    fileFormat,
    sizeBytes,
    userId,
    userRole = null,
    userDepartmentId = null
  }) {
    this.ticketId = ticketId;
    this.fileUrl = fileUrl;
    this.fileFormat = fileFormat;
    this.sizeBytes = sizeBytes;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = AddTicketAttachmentCommand;

