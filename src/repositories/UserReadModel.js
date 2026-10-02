class UserReadModel {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        apellido_pat,
        apellido_mat,
        tel,
        user_roles (
          roles (
            descripcion
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const roles = (data.user_roles || []).map(rp => rp.roles?.descripcion).filter(Boolean);

      return {
        id: data.id,
        nombre: data.full_name,
        apellido_pat: data.apellido_pat,
        apellido_mat: data.apellido_mat,
        tel: data.tel,
        role: roles[0] || 'sin_rol',
        roles: roles
      };
    }

    return null;
  }
}

module.exports = UserReadModel;
