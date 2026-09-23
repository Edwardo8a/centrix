const supabase = require('../db/supabaseClient');

class UserRepository {
  async create(userData) {
    // 1. Insertar en la tabla personas
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .insert([{
        nombre: userData.nombre,
        apellido_pat: userData.apellido_pat,
        apellido_mat: userData.apellido_mat,
        tel: userData.tel
      }])
      .select()
      .single();

    if (personaError) {
      throw new Error(`Error al crear la persona: ${personaError.message}`);
    }

    // 2. Asignar el rol por defecto (ID 1) en roles_personas
    const { error: rolError } = await supabase
      .from('roles_personas')
      .insert([{
        id_persona: persona.id,
        id_rol: 1
      }]);

    if (rolError) {
      throw new Error(`Error al asignar el rol por defecto: ${rolError.message}`);
    }

    return persona;
  }

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
