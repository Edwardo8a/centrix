const BusinessError = require('../../exceptions/BusinessError');

class GetAllUsersHandler {
  /**
   * @param {{ userReadModel: import('../../contracts').IUserReadModel }} deps
   */
  constructor({ userReadModel }) {
    this.userReadModel = userReadModel;
  }

  async handle(query = {}) {
    const rawPage = query.page ?? 1;
    const page = Number(rawPage);

    const rawLimit = query.limit ?? 20;
    const limit = Number(rawLimit);

    if (!Number.isInteger(page) || page < 1) {
      throw new BusinessError('El parámetro page debe ser un entero >= 1', 400);
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BusinessError('El parámetro limit debe estar entre 1 y 100', 400);
    }

    return await this.userReadModel.getAllUsers({
      role: query.role,
      departmentId: query.departmentId,
      search: query.search,
      page,
      limit
    });
  }
}

module.exports = GetAllUsersHandler;
