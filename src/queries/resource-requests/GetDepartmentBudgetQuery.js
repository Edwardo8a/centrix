class GetDepartmentBudgetQuery {
  constructor({ departmentId, year, month, userRole, userDepartmentId }) {
    this.departmentId = departmentId;
    this.year = year ? Number(year) : new Date().getFullYear();
    this.month = month ? Number(month) : new Date().getMonth() + 1;
    this.userRole = userRole;
    this.userDepartmentId = userDepartmentId;
    Object.freeze(this);
  }
}

module.exports = GetDepartmentBudgetQuery;
