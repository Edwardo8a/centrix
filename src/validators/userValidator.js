const { body, query } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Debe ingresar un email válido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

const createUserValidator = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password').isLength({ min: 8 }).withMessage('El password debe tener al menos 8 caracteres'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido_pat').trim().notEmpty().withMessage('El apellido paterno es obligatorio')
];

const getSolversValidator = [
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido')
];

const deviceTokenValidator = [
  body('fcm_token').notEmpty().withMessage('El fcm_token es obligatorio'),
  body('platform').optional().isIn(['android', 'ios', 'web']).withMessage('Plataforma no válida')
];

module.exports = {
  loginValidator,
  createUserValidator,
  getSolversValidator,
  deviceTokenValidator
};
