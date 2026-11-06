class GetAssignedTicketsQuery {
  constructor({ userId } = {}) {
    this.userId = userId;
    Object.freeze(this);
  }
}

module.exports = GetAssignedTicketsQuery;

