const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');
const supabase = require('../../config/supabaseClient');
const BusinessError = require('../../exceptions/BusinessError');

class LoginCommand {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }) {
    // 1. Validar las credenciales usando Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BusinessError('Credenciales invalidas', 401);
    }

    // 2. Traer los datos del usuario usando el UUID devuelto por Supabase Auth
    const user = await this.userRepository.findPersonaById(data.user.id);
    if (!user) {
      throw new BusinessError('Usuario no encontrado en la base de datos', 404);
    }

    // 3. Generar JWT firmado
    const token = jwt.sign(
      { id: user.id, email: email, role: user.role, roles: user.roles },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const fullName = `${user.nombre} ${user.apellido_pat || ''} ${user.apellido_mat || ''}`.trim();

    return {
      user: {
        id: user.id,
        email: email,
        fullName: fullName,
        role: user.role,
        roles: user.roles,
        tel: user.tel
      },
      token
    };
  }
}

module.exports = LoginCommand;
