const { body } = require('express-validator');

const expenseValidator = [
  body('concept').notEmpty().withMessage('El concepto es obligatorio'),
  body('amount').isNumeric().withMessage('El monto debe ser un valor numérico'),
  body('costCenter').notEmpty().withMessage('El centro de costo es obligatorio'),
  body('date').isISO8601().withMessage('Debe proporcionar una fecha válida')
];

module.exports = {
  expenseValidator
};
