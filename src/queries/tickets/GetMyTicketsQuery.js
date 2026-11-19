class GetMyTicketsQuery {
  constructor({ userId } = {}) {
    this.userId = userId;
    Object.freeze(this);
  }
}

module.exports = GetMyTicketsQuery;

