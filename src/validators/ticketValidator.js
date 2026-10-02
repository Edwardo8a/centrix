const { body } = require('express-validator');

// Validador para la creacion de tickets
const ticketValidator = [
  body('title').notEmpty().withMessage('El titulo es obligatorio'),
  body('description').notEmpty().withMessage('La descripcion es obligatoria'),
  body('priority').notEmpty().withMessage('La prioridad es obligatoria'),
  body('department_id').notEmpty().withMessage('El departamento es obligatorio'),
];

// Validador para la actualizacion de estado de tickets
const updateTicketStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isString()
    .withMessage('El estado debe ser una cadena de texto')
];

module.exports = {
  ticketValidator,
  updateTicketStatusValidator
};
