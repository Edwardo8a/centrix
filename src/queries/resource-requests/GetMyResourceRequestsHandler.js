class GetMyResourceRequestsHandler {
  /**
   * @param {{ resourceRequestReadModel: import('../../contracts').IResourceRequestReadModel }} deps
   */
  constructor({ resourceRequestReadModel }) {
    this.resourceRequestReadModel = resourceRequestReadModel;
  }

  async handle(query) {
    return await this.resourceRequestReadModel.getRequestsByCreator(query.userId);
  }
}

module.exports = GetMyResourceRequestsHandler;
