class ManageUserCommand {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    const supabase = require('../../../infrastructure/db/supabaseClient');
    
    // 1. Crear el usuario en Supabase Auth (usando signUp para que registre correo/password)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      throw new Error(`Error al crear usuario en Auth: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo obtener el ID del usuario creado en Auth.');
    }

    // 2. Pasar el id de auth al repositorio para que lo guarde en "personas"
    return await this.userRepository.create(userData, authData.user.id);
  }
async updateUserRoles(userId, roleIds) {
    const BusinessError = require('../../../core/exceptions/BusinessError');
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new BusinessError('Debe proporcionar al menos un ID de rol en formato de arreglo.', 400);
    }
    await this.userRepository.assignRoles(userId, roleIds);
    return { id: userId, roles: roleIds };
  }
}

module.exports = ManageUserCommand;
