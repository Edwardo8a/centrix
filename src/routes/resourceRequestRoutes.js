const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const {
  createResourceRequestValidator,
  getResourceRequestsByDepartmentValidator,
  getResourceRequestByIdValidator,
  deleteResourceRequestValidator
} = require('../validators/resourceRequestValidator');
const { validateResult } = require('../utils/validatorHelpers');
const {
  resourceRequestCommandController,
  resourceRequestQueryController
} = require('../config/container');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lecturas) ---

// Consultar mis solicitudes
router.get(
  '/mine',
  resourceRequestQueryController.getMine
);

// Consultar solicitudes del departamento (Supervisor / Gerente / Admin)
router.get(
  '/department',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getResourceRequestsByDepartmentValidator,
  validateResult,
  resourceRequestQueryController.getByDepartment
);

// Consultar detalle de solicitud por ID
router.get(
  '/:id',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getResourceRequestByIdValidator,
  validateResult,
  resourceRequestQueryController.getById
);

// --- CQRS COMMANDS (Escrituras) ---

// Crear solicitud de recurso (Colaborador, Gerente o Administrador)
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  createResourceRequestValidator,
  validateResult,
  resourceRequestCommandController.create
);

// Eliminación lógica (soft delete) de solicitud
router.delete(
  '/:id',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  deleteResourceRequestValidator,
  validateResult,
  resourceRequestCommandController.delete
);

module.exports = router;
