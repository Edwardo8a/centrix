const express = require('express');
const { adminController } = require('../config/container');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator
} = require('../validators/userValidator');
const { validateResult } = require('../utils/validatorHelpers');

const router = express.Router();

router.use(authMiddleware);
router.use(roleCheck([UserRole.ADMINISTRADOR]));

// HU-11: Creacion de usuario por administrador
router.post(
  '/users',
  createUserValidator,
  validateResult,
  adminController.createUser
);

// Actualizacion de usuario por administrador
router.put(
  '/users/:id',
  updateUserValidator,
  validateResult,
  adminController.updateUser
);

// Eliminacion logica (soft delete) de usuario por administrador
router.delete(
  '/users/:id',
  deleteUserValidator,
  validateResult,
  adminController.deleteUser
);

module.exports = router;
