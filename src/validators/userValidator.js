const { body, query, param } = require('express-validator');

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

const getAllUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El parámetro page debe ser un entero mayor o igual a 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El parámetro limit debe estar entre 1 y 100'),
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido'),
  query('role')
    .optional()
    .isString()
    .trim(),
  query('search')
    .optional()
    .isString()
    .trim()
];

const updateUserValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID de usuario debe ser un UUID válido'),
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío si se proporciona'),
  body('apellido_pat')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El apellido paterno no puede estar vacío si se proporciona'),
  body('apellido_mat')
    .optional()
    .trim(),
  body('tel')
    .optional()
    .trim(),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido'),
  body('role')
    .optional()
    .isString()
    .trim()
];

const deleteUserValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID de usuario debe ser un UUID válido')
];

module.exports = {
  loginValidator,
  createUserValidator,
  getSolversValidator,
  getAllUsersValidator,
  updateUserValidator,
  deleteUserValidator
};
