class ManageRolesUseCase {
  async updateRole(userId, newRole) {
    return { userId, newRole };
  }
}

module.exports = ManageRolesUseCase;
