class GetTicketsByDepartmentQuery {
  constructor({ userRole, userDepartmentId = null, departmentId = null } = {}) {
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    this.departmentId = departmentId;
    Object.freeze(this);
  }
}

module.exports = GetTicketsByDepartmentQuery;
