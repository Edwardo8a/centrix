const ResourceRequest = require('../../models/ResourceRequest');

class CreateResourceRequestHandler {
  /**
   * @param {{ resourceRequestRepository: import('../../contracts').IResourceRequestRepository }} deps
   */
  constructor({ resourceRequestRepository }) {
    this.resourceRequestRepository = resourceRequestRepository;
  }

  async handle(command) {
    const request = new ResourceRequest({
      title: command.title,
      description: command.description,
      category: command.category,
      estimated_amount: command.estimatedAmount,
      department_id: command.departmentId,
      created_by: command.userId
    });

    const result = await this.resourceRequestRepository.create(request);
    return { id: result.id };
  }
}

module.exports = CreateResourceRequestHandler;
