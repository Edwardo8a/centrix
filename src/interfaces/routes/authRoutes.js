const express = require('express');
const AuthController = require('../controllers/AuthController');
const { loginValidator } = require('../validators/userValidator');
const { validateResult } = require('../../utils/validatorHelpers');

const router = express.Router();

router.post('/login', loginValidator, validateResult, AuthController.login);

module.exports = router;
