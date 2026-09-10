class RequestModificationUseCase {
  constructor({ approvalRepository, auditService }) {
    this.approvalRepository = approvalRepository;
    this.auditService = auditService;
  }

  async execute({ requestType, requestId, approverId, comment }) {
    const modification = await this.approvalRepository.create({
      request_type: requestType,
      request_id: requestId,
      approver_id: approverId,
      action: 'modified',
      comment
    });

    if (this.auditService) {
      await this.auditService.logAction(approverId, `REQUEST_MODIFICATION_${requestType.toUpperCase()}`, requestType + 's', requestId);
    }

    return modification;
  }
}

module.exports = RequestModificationUseCase;
