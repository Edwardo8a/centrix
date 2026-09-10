class ManageUserCommand {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    return await this.userRepository.create(userData);
  }
}

module.exports = ManageUserCommand;
