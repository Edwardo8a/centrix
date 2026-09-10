const { body } = require('express-validator');

const ticketValidator = [
  body('title').notEmpty().withMessage('El título es obligatorio'),
  body('description').notEmpty().withMessage('La descripción es obligatoria'),
  body('category').notEmpty().withMessage('La categoría es obligatoria')
];

module.exports = {
  ticketValidator
};
