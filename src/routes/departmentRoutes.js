const express = require('express');
const { departmentCommandController, departmentQueryController } = require('../config/container');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const { createDepartmentValidator } = require('../validators/departmentValidator');
const { validateResult } = require('../utils/validatorHelpers');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lectura) ---
// HU-13: Obtener departamentos
router.get('/', departmentQueryController.getAll);

// --- CQRS COMMANDS (Escritura) ---
router.post(
  '/',
  roleCheck([UserRole.ADMINISTRADOR]),
  createDepartmentValidator,
  validateResult,
  departmentCommandController.create
);

module.exports = router;
