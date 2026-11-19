class GetAllTicketsQuery {
  constructor({
    status = null,
    departmentId = null,
    priority = null,
    page = 1,
    limit = 20
  } = {}) {
    this.status = status;
    this.departmentId = departmentId;
    this.priority = priority;
    this.page = page;
    this.limit = limit;
    Object.freeze(this);
  }
}

module.exports = GetAllTicketsQuery;

