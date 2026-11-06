const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const { getSolversValidator } = require('../validators/userValidator');
const { validateResult } = require('../utils/validatorHelpers');
const { userQueryController } = require('../config/container');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/solvers',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getSolversValidator,
  validateResult,
  userQueryController.getSolvers
);

module.exports = router;

