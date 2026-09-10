class Approval {
  constructor({ id, requestType, requestId, approverId, action, comment, createdAt }) {
    this.id = id;
    this.requestType = requestType;
    this.requestId = requestId;
    this.approverId = approverId;
    this.action = action;
    this.comment = comment;
    this.createdAt = createdAt;
  }
}

module.exports = Approval;
