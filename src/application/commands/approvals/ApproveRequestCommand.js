class ApproveRequestCommand {
  constructor({ approvalRepository, auditService }) {
    this.approvalRepository = approvalRepository;
    this.auditService = auditService;
  }

  async execute({ requestType, requestId, approverId, comment }) {
    const approval = await this.approvalRepository.create({
      request_type: requestType,
      request_id: requestId,
      approver_id: approverId,
      action: 'approved',
      comment
    });

    if (this.auditService) {
      await this.auditService.logAction(approverId, `APPROVE_${requestType.toUpperCase()}`, requestType + 's', requestId);
    }

    return approval;
  }
}

module.exports = ApproveRequestCommand;
