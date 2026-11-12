class GetAllUsersQuery {
  constructor({
    role = null,
    departmentId = null,
    search = null,
    page = 1,
    limit = 20
  } = {}) {
    this.role = role;
    this.departmentId = departmentId;
    this.search = search;
    this.page = page;
    this.limit = limit;
    Object.freeze(this);
  }
}

module.exports = GetAllUsersQuery;
