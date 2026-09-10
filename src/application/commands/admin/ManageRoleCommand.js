class ManageRoleCommand {
  async updateRole(userId, newRole) {
    return { userId, newRole };
  }
}

module.exports = ManageRoleCommand;
