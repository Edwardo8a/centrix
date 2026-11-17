const UserRole = require('../enums/UserRole');
const BusinessError = require('../exceptions/BusinessError');

class UserRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async getRoles() {
    const { data, error } = await this.supabase.from('roles').select('id, descripcion').order('id');
    if (error) throw error;
    return (data || []).map(row => ({ role: String(row.descripcion).trim().toLowerCase(), description: row.descripcion }))
      .filter(row => Object.values(UserRole).includes(row.role));
  }

  async resolveAssignment(role = UserRole.COLABORADOR, departmentId = null) {
    const normalized = typeof role === 'string' ? role.trim().toLowerCase() : '';
    if (!Object.values(UserRole).includes(normalized)) throw new BusinessError('Selecciona un rol válido', 400);
    if (normalized !== UserRole.ADMINISTRADOR && !departmentId) {
      throw new BusinessError('El departamento es obligatorio para el rol seleccionado', 400);
    }
    const { data: roleRecord, error } = await this.supabase.from('roles').select('id, descripcion')
      .ilike('descripcion', normalized).maybeSingle();
    if (error) throw error;
    if (!roleRecord) throw new BusinessError('El rol seleccionado no está configurado', 400);
    if (departmentId) {
      const department = await this.supabase.from('departments').select('id').eq('id', departmentId).maybeSingle();
      if (department.error) throw department.error;
      if (!department.data) throw new BusinessError('El departamento seleccionado no existe', 400);
    }
    return { role: normalized, roleId: roleRecord.id, departmentId: departmentId || null };
  }

  async create(userData, authId, resolvedAssignment = null) {
    const assignment = resolvedAssignment || await this.resolveAssignment(userData.role, userData.department_id);
    // 1. Insertar en la tabla users
    const { data: userRecord, error: userError } = await this.supabase
      .from('users')
      .insert([{
        id: authId,
        full_name: userData.nombre,
        apellido_pat: userData.apellido_pat,
        apellido_mat: userData.apellido_mat,
        tel: userData.tel,
        email: userData.email,
        department_id: assignment.departmentId
      }])
      .select()
      .single();

    if (userError) {
      throw new Error(`Error al crear el usuario: ${userError.message}`);
    }

    // Only this newly created account: remove roles assigned automatically by a DB trigger.
    const { error: cleanupError } = await this.supabase.from('user_roles').delete().eq('user_id', userRecord.id);
    if (cleanupError) {
      await this.supabase.from('users').delete().eq('id', userRecord.id);
      throw cleanupError;
    }

    // Resolve by description, never assume that role ID 1 is a collaborator.
    const { error: rolError } = await this.supabase
      .from('user_roles')
      .insert([{
        user_id: userRecord.id,
        role_id: assignment.roleId
      }]);

    if (rolError) {
      await this.supabase.from('users').delete().eq('id', userRecord.id);
      throw new Error(`Error al asignar el rol seleccionado: ${rolError.message}`);
    }

    return userRecord;
  }
}

module.exports = UserRepository;
