const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');
const BusinessError = require('../../core/exceptions/BusinessError');

class LoginUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(email, password) {
    //  Validar credenciales usando Supabase Auth
    const supabase = require('../../../infrastructure/db/supabaseClient');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if(error){
      throw new BusinessError('Credenciales Invalidas', 401);
    }
    
    // Traer los Datos del Usuario de nuestra Base de Datos
    const user = await this.userRepository.findByEmail(email);
    if(!user){
      throw new BusinessError('Usuario no encontrado en la base de datos');
    }

    // 3. Generar nuestro propio JWT con nuestra configuración
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      token
    };
  }
}

module.exports = LoginUseCase;
