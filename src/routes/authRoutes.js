const express = require('express');
const { authController } = require('../config/container');
const { loginValidator } = require('../validators/userValidator');
const { validateResult } = require('../utils/validatorHelpers');

const router = express.Router();

router.post('/login', loginValidator, validateResult, authController.login);

module.exports = router;
