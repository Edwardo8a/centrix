const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const {
  getSolversValidator,
  getAllUsersValidator,
  updateUserValidator,
  deleteUserValidator
} = require('../validators/userValidator');
const { validateResult } = require('../utils/validatorHelpers');
const { userQueryController, adminController } = require('../config/container');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lecturas) ---

router.get(
  '/',
  roleCheck([UserRole.ADMINISTRADOR]),
  getAllUsersValidator,
  validateResult,
  userQueryController.getAll
);

router.get(
  '/solvers',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getSolversValidator,
  validateResult,
  userQueryController.getSolvers
);

// --- CQRS COMMANDS (Escrituras) ---

router.put(
  '/:id',
  roleCheck([UserRole.ADMINISTRADOR]),
  updateUserValidator,
  validateResult,
  adminController.updateUser
);

router.delete(
  '/:id',
  roleCheck([UserRole.ADMINISTRADOR]),
  deleteUserValidator,
  validateResult,
  adminController.deleteUser
);

module.exports = router;