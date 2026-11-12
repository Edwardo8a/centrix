class GetMyResourceRequestsQuery {
  constructor({ userId }) {
    this.userId = userId;
    Object.freeze(this);
  }
}

module.exports = GetMyResourceRequestsQuery;
