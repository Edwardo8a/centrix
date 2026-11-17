const { body, query } = require('express-validator');
const UserRole = require('../enums/UserRole');

const loginValidator = [
  body('email').isEmail().withMessage('Debe ingresar un email válido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

const createUserValidator = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password').isLength({ min: 8 }).withMessage('El password debe tener al menos 8 caracteres'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('apellido_pat').trim().notEmpty().withMessage('El apellido paterno es obligatorio'),
  body('role').optional().isString().bail().trim().toLowerCase()
    .isIn(Object.values(UserRole)).withMessage('Selecciona un rol válido'),
  body('department_id').optional({ nullable: true }).isUUID().withMessage('Selecciona un departamento válido'),
  body('tel').optional().isString().bail().trim().isLength({ max: 30 }).withMessage('El teléfono no puede superar 30 caracteres')
];

const getSolversValidator = [
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido')
];

module.exports = {
  loginValidator,
  createUserValidator,
  getSolversValidator
};
