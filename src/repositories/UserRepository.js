class UserRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async create(userData, authId) {
    // 1. Insertar en la tabla users
    const { data: userRecord, error: userError } = await this.supabase
      .from('users')
      .insert([{
        id: authId,
        full_name: userData.nombre,
        apellido_pat: userData.apellido_pat,
        apellido_mat: userData.apellido_mat,
        tel: userData.tel,
        email: userData.email
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(`Error al crear el usuario: ${userError.message}`);
    }

    // 2. Asignar el rol por defecto (ID 1) en user_roles
    const { error: rolError } = await this.supabase
      .from('user_roles')
      .insert([{
        user_id: userRecord.id,
        role_id: 1
      }]);

    if (rolError) {
      await this.supabase.from('users').delete().eq('id', userRecord.id);
      throw new Error(`Error al asignar el rol por defecto: ${rolError.message}`);
    }

    return userRecord;
  }
}

module.exports = UserRepository;
