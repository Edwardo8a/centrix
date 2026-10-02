const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Debe ingresar un email válido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

module.exports = {
  loginValidator
};
