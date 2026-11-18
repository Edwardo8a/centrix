const UserRole = require('../enums/UserRole');

const ROLE_PRIORITY = [
  UserRole.ADMINISTRADOR,
  UserRole.GERENTE,
  UserRole.SOPORTE_TECNICO,
  UserRole.COLABORADOR
];

const USER_CACHE_TTL_MS = 30 * 1000; // 30 segundos

function resolvePrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'sin_rol';
  }
  const normalizedSet = new Set(roles.map(r => String(r).trim().toLowerCase()));
  for (const priorityRole of ROLE_PRIORITY) {
    if (normalizedSet.has(priorityRole)) {
      return priorityRole;
    }
  }
  return String(roles[0]).trim().toLowerCase();
}

class UserReadModel {
  constructor({ supabase, cacheTtlMs = USER_CACHE_TTL_MS }) {
    this.supabase = supabase;
    this.cacheTtlMs = cacheTtlMs;
    this._userCache = new Map();
  }

  async findById(id) {
    const useCache = process.env.NODE_ENV !== 'test' && this.cacheTtlMs > 0;
    if (useCache && this._userCache.has(id)) {
      const cached = this._userCache.get(id);
      if (Date.now() < cached.expiresAt) {
        return cached.value;
      }
      this._userCache.delete(id);
    }

    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        apellido_pat,
        apellido_mat,
        tel,
        department_id,
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
      const roles = (data.user_roles || [])
        .map(rp => rp.roles?.descripcion)
        .filter(Boolean)
        .map(r => String(r).trim().toLowerCase());

      const userDto = {
        id: data.id,
        nombre: data.full_name,
        apellido_pat: data.apellido_pat,
        apellido_mat: data.apellido_mat,
        tel: data.tel,
        department_id: data.department_id ?? null,
        role: resolvePrimaryRole(roles),
        roles
      };

      if (useCache) {
        this._userCache.set(id, {
          value: userDto,
          expiresAt: Date.now() + this.cacheTtlMs
        });
      }

      return userDto;
    }

    return null;
  }

  async getSolversByDepartment(departmentId) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        apellido_pat,
        apellido_mat,
        user_roles (
          roles (
            descripcion
          )
        )
      `)
      .eq('department_id', departmentId);

    if (error) throw error;

    return (data || [])
      .filter(user => {
        const roles = (user.user_roles || [])
          .map(rp => rp.roles?.descripcion)
          .filter(Boolean)
          .map(r => String(r).trim().toLowerCase());
        return roles.includes(UserRole.SOPORTE_TECNICO);
      })
      .map(user => ({
        id: user.id,
        fullName: [user.full_name, user.apellido_pat, user.apellido_mat]
          .filter(Boolean)
          .join(' ')
          .trim()
      }));
  }

  async getAllUsers({ role = null, departmentId = null, search = null, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabase
      .from('users')
      .select(`
        id,
        full_name,
        apellido_pat,
        apellido_mat,
        email,
        tel,
        department_id,
        user_roles (
          roles (
            descripcion
          )
        )
      `, { count: 'exact' })
      .is('deleted_at', null);

    if (departmentId) {
      queryBuilder = queryBuilder.eq('department_id', departmentId);
    }

    if (search) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await queryBuilder
      .order('full_name', { ascending: true })
      .range(from, to);

    if (error) throw error;

    let items = (data || []).map(user => {
      const roles = (user.user_roles || [])
        .map(rp => rp.roles?.descripcion)
        .filter(Boolean)
        .map(r => String(r).trim().toLowerCase());

      return {
        id: user.id,
        nombre: user.full_name,
        apellido_pat: user.apellido_pat,
        apellido_mat: user.apellido_mat,
        fullName: [user.full_name, user.apellido_pat, user.apellido_mat]
          .filter(Boolean)
          .join(' ')
          .trim(),
        email: user.email,
        tel: user.tel,
        departmentId: user.department_id ?? null,
        role: resolvePrimaryRole(roles),
        roles
      };
    });

    if (role) {
      const normalizedRole = String(role).trim().toLowerCase();
      items = items.filter(u => u.roles.includes(normalizedRole));
    }

    const total = count ?? 0;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    };
  }
}

module.exports = UserReadModel;
