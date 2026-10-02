const supabase = require('../../config/supabaseClient');
const BusinessError = require('../../exceptions/BusinessError');

class ManageUserCommand {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      throw new BusinessError(`Error al crear usuario en Auth: ${authError.message}`, 400);
    }

    if (!authData.user) {
      throw new BusinessError('No se pudo obtener el ID del usuario creado en Auth.', 500);
    }

    // 2. Guardar los datos en el repositorio
    return await this.userRepository.create(userData, authData.user.id);
  }

  async updateUserRoles(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new BusinessError('Debe proporcionar al menos un ID de rol en formato de arreglo.', 400);
    }
    await this.userRepository.assignRoles(userId, roleIds);
    return { id: userId, roles: roleIds };
  }
}

module.exports = ManageUserCommand;
