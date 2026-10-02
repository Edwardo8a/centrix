const supabase = require('../config/supabaseClient');

class UserRepository {
  async create(userData, authId) {
    // 1. Insertar en la tabla users
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authId,
        full_name: userData.nombre,
        apellido_pat: userData.apellido_pat,
        apellido_mat: userData.apellido_mat,
        tel: userData.tel
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(`Error al crear el usuario: ${userError.message}`);
    }

    // 2. Asignar el rol por defecto (ID 1) en user_roles
    const { error: rolError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userRecord.id,
        role_id: 1
      }]);

    if (rolError) {
      throw new Error(`Error al asignar el rol por defecto: ${rolError.message}`);
    }

    return userRecord;
  }

  async assignRoles(personaId, roleIds) {
    // 1. Intentar con esquema user_roles (ingles)
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', personaId);

    if (!deleteError) {
      const newRoles = roleIds.map(roleId => ({
        user_id: personaId,
        role_id: roleId
      }));

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(newRoles);

      if (!insertError) return true;
    }

    // Fallback a esquema roles_personas (espanol)
    const { error: fallbackDelete } = await supabase
      .from('roles_personas')
      .delete()
      .eq('id_persona', personaId);

    if (fallbackDelete) {
      throw new Error(`Error al eliminar roles actuales: ${fallbackDelete.message}`);
    }

    const fallbackRoles = roleIds.map(roleId => ({
      id_persona: personaId,
      id_rol: roleId
    }));

    const { error: fallbackInsert } = await supabase
      .from('roles_personas')
      .insert(fallbackRoles);

    if (fallbackInsert) {
      throw new Error(`Error al asignar nuevos roles: ${fallbackInsert.message}`);
    }

    return true;
  }

  async findPersonaById(id) {
    const { data, error } = await supabase
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

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

module.exports = UserRepository;
