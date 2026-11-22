const { body } = require('express-validator');

const createDepartmentValidator = [
  body('name')
    .isString().withMessage('El nombre debe ser texto')
    .bail()
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio'),
  body('description')
    .optional({ values: 'null' })
    .isString().withMessage('La descripción debe ser texto')
    .bail()
    .trim()
];

module.exports = { createDepartmentValidator };
