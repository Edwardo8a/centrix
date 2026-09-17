const jwt = require('jsonwebtoken');
const jwtConfig = require('../../../config/jwt');
const BusinessError = require('../../../core/exceptions/BusinessError');

class LoginCommand {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }) {
    // Validar las credenciales usando Supabase Auth
    const supabase = require('../../../infrastructure/db/supabaseClient');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BusinessError('Credenciales inválidas', 401);
    }

    // Traer los datos del usuario de la tabla "personas" usando el UUID devuelto por Supabase Auth
    const user = await this.userRepository.findPersonaById(data.user.id);
    if (!user) {
      throw new BusinessError('Usuario no encontrado en la tabla de personas', 404);
    }

    // Generar nuestro propio JWT con nuestra configuración
    // Nota: Guardamos en el JWT el email de Supabase y el rol extraído de tu DB
    const token = jwt.sign(
      { id: user.id, email: email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Concatenamos el nombre completo si es necesario
    const fullName = `${user.nombre} ${user.apellido_pat} ${user.apellido_mat || ''}`.trim();

    return {
      user: {
        id: user.id,
        email: email,
        fullName: fullName,
        role: user.role,
        tel: user.tel
      },
      token
    };
  }
}

module.exports = LoginCommand;
