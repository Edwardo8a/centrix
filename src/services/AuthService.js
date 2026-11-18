const BusinessError = require('../exceptions/BusinessError');

class AuthService {
  constructor({ authClient, adminClient }) {
    this.authClient = authClient;
    this.adminClient = adminClient;
  }

  async signIn(email, password) {
    const { data, error } = await this.authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BusinessError('Credenciales invalidas', 401);
    }

    return { authId: data.user.id };
  }

  async signUp(email, password) {
    const { data, error } = await this.authClient.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new BusinessError(`Error al crear usuario en Auth: ${error.message}`, 400);
    }
    
    if (!data.user) {
      throw new BusinessError('No se pudo obtener el ID del usuario creado en Auth.', 500);
    }

    return { authId: data.user.id };
  }

  async deleteUser(authId) {
    const admin = this.adminClient;
    if (!admin) {
      throw new BusinessError('Admin client no está configurado (falta SUPABASE_SERVICE_ROLE_KEY)', 500);
    }
    const { error } = await admin.auth.admin.deleteUser(authId);
    if (error) {
      throw new BusinessError(`Error al eliminar usuario en Auth: ${error.message}`, 500);
    }
  }
}

module.exports = AuthService;
