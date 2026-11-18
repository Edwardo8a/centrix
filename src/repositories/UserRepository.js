const UserRole = require('../enums/UserRole');

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

    // 2. Resolver el rol por defecto ('colaborador') por descripcion (case-insensitive)
    const { data: roleRecord, error: roleLookupError } = await this.supabase
      .from('roles')
      .select('id, descripcion')
      .ilike('descripcion', UserRole.COLABORADOR)
      .maybeSingle();

    if (roleLookupError || !roleRecord) {
      await this.supabase.from('users').delete().eq('id', userRecord.id);
      throw new Error(
        `Error al obtener el rol por defecto (${UserRole.COLABORADOR}): ${
          roleLookupError ? roleLookupError.message : 'Rol no encontrado'
        }`
      );
    }

    // 3. Asignar el rol por defecto en user_roles
    const { error: rolError } = await this.supabase
      .from('user_roles')
      .insert([{
        user_id: userRecord.id,
        role_id: roleRecord.id
      }]);

    if (rolError) {
      await this.supabase.from('users').delete().eq('id', userRecord.id);
      throw new Error(`Error al asignar el rol por defecto: ${rolError.message}`);
    }

    return userRecord;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, full_name, apellido_pat, apellido_mat, tel, email, department_id, deleted_at')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async update(userId, data) {
    const updatePayload = {};
    if (data.nombre !== undefined) updatePayload.full_name = data.nombre;
    if (data.apellido_pat !== undefined) updatePayload.apellido_pat = data.apellido_pat;
    if (data.apellido_mat !== undefined) updatePayload.apellido_mat = data.apellido_mat;
    if (data.tel !== undefined) updatePayload.tel = data.tel;
    if (data.departmentId !== undefined) updatePayload.department_id = data.departmentId;

    if (Object.keys(updatePayload).length > 0) {
      const { error: userError } = await this.supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .is('deleted_at', null);

      if (userError) throw userError;
    }

    // Si se envía un rol para actualizar
    if (data.role) {
      const { data: roleRecord, error: roleLookupError } = await this.supabase
        .from('roles')
        .select('id, descripcion')
        .ilike('descripcion', data.role)
        .maybeSingle();

      if (roleLookupError || !roleRecord) {
        throw new Error(`Rol no válido: ${data.role}`);
      }

      // Actualizar o reasignar en user_roles
      await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      const { error: insertRoleError } = await this.supabase
        .from('user_roles')
        .insert([{ user_id: userId, role_id: roleRecord.id }]);

      if (insertRoleError) throw insertRoleError;
    }

    return await this.findById(userId);
  }

  async softDelete(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

module.exports = UserRepository;
