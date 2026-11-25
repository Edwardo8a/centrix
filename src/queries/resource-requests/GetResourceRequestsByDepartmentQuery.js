class GetResourceRequestsByDepartmentQuery {
  constructor({ userRole, userDepartmentId, departmentId = null, status = null, category = null, search = null, month = null, year = null, page = 1, limit = 50 } = {}) {
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    this.departmentId = departmentId;
    this.status = status;
    this.category = category;
    this.search = search;
    this.month = month;
    this.year = year;
    this.page = page;
    this.limit = limit;
    Object.freeze(this);
  }
}

module.exports = GetResourceRequestsByDepartmentQuery;
