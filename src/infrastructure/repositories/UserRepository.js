const supabase = require('../db/supabaseClient');

class UserRepository {
  // Ahora usamos el id devuelto por el Auth de Supabase
  async findPersonaById(id) {
    const { data, error } = await supabase
      .from('personas')
      .select(`
        id,
        nombre,
        apellido_pat,
        apellido_mat,
        tel,
        roles_personas (
          roles (
            descripcion
          )
        )
      `)
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Extraemos el listado de roles (si tiene varios, tomamos el primero o armamos un array)
      const roles = data.roles_personas.map(rp => rp.roles.descripcion);
      
      return {
        id: data.id,
        nombre: data.nombre,
        apellido_pat: data.apellido_pat,
        apellido_mat: data.apellido_mat,
        tel: data.tel,
        role: roles[0] || 'sin_rol', // Asumimos un rol principal para el JWT
        roles: roles // Por si quieres guardar todos los roles en el futuro
      };
    }
    
    return null;
  }
}

module.exports = UserRepository;
