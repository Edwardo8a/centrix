class GetResourceRequestByIdQuery {
  constructor({ requestId, userId, userRole, userDepartmentId }) {
    this.requestId = requestId;
    this.userId = userId;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = GetResourceRequestByIdQuery;
