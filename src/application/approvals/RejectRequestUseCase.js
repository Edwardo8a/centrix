class RejectRequestUseCase {
  constructor({ approvalRepository, auditService }) {
    this.approvalRepository = approvalRepository;
    this.auditService = auditService;
  }

  async execute({ requestType, requestId, approverId, comment }) {
    const rejection = await this.approvalRepository.create({
      request_type: requestType,
      request_id: requestId,
      approver_id: approverId,
      action: 'rejected',
      comment
    });

    if (this.auditService) {
      await this.auditService.logAction(approverId, `REJECT_${requestType.toUpperCase()}`, requestType + 's', requestId);
    }

    return rejection;
  }
}

module.exports = RejectRequestUseCase;
