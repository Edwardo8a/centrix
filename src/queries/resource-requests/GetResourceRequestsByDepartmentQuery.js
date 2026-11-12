class GetResourceRequestsByDepartmentQuery {
  constructor({ userRole, userDepartmentId, departmentId = null, status = null, page = 1, limit = 20 } = {}) {
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    this.departmentId = departmentId;
    this.status = status;
    this.page = page;
    this.limit = limit;
    Object.freeze(this);
  }
}

module.exports = GetResourceRequestsByDepartmentQuery;
