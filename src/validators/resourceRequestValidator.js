const { body, query, param } = require('express-validator');
const { VALID_CATEGORIES, normalizeResourceRequestCategory } = require('../enums/ResourceRequestCategory');

const createResourceRequestValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título de la solicitud es obligatorio')
    .isLength({ max: 150 })
    .withMessage('El título no puede exceder 150 caracteres'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción de la solicitud es obligatoria'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('La categoría es obligatoria')
    .custom((val) => {
      const normalized = normalizeResourceRequestCategory(val);
      if (!normalized || !VALID_CATEGORIES.includes(normalized)) {
        throw new Error(`Categoría inválida. Debe ser: ${VALID_CATEGORIES.join(', ')}`);
      }
      return true;
    }),

  body('estimated_amount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El monto estimado debe ser un número mayor o igual a 0'),

  body('department_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('El ID de departamento debe ser un UUID válido')
];

const getResourceRequestsByDepartmentValidator = [
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID de departamento debe ser un UUID válido'),

  query('status')
    .optional()
    .isString()
    .trim(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El parámetro page debe ser un entero mayor o igual a 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El parámetro limit debe estar entre 1 y 100')
];

const getResourceRequestByIdValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID de la solicitud debe ser un UUID válido')
];

const deleteResourceRequestValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID de la solicitud debe ser un UUID válido')
];

module.exports = {
  createResourceRequestValidator,
  getResourceRequestsByDepartmentValidator,
  getResourceRequestByIdValidator,
  deleteResourceRequestValidator
};
