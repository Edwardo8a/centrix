const { body } = require('express-validator');

const ticketValidator = [
  body('Titulo').notEmpty().withMessage('El título es obligatorio'),
  body('Descripcion').notEmpty().withMessage('La descripción es obligatoria'),
  body('Prioridad').notEmpty().withMessage('La prioridad es obligatoria'),
  body('id_departamento').notEmpty().withMessage('El departamento es obligatorio'),
];

module.exports = {
  ticketValidator
};
