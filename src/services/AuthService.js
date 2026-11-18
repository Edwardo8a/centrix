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
    if (!this.adminClient) {
      throw new BusinessError('El alta administrativa requiere SUPABASE_SERVICE_ROLE_KEY en el backend', 500);
    }
    // Administrative provisioning: the protected admin endpoint activates the account.
    // createUser does not send signup emails or change the current auth session.
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      if (['email_exists', 'user_already_exists'].includes(error.code)) {
        throw new BusinessError('Ya existe una cuenta con ese correo electrónico.', 409);
      }
      if (error.status === 429) {
        throw new BusinessError('Supabase limitó temporalmente las altas. Inténtalo más tarde.', 429);
      }
      throw new BusinessError(`Error al crear usuario en Auth: ${error.message}`, 400);
    }
    
    if (!data?.user?.id) {
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
