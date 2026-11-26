const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const {
  createResourceRequestValidator,
  getResourceRequestsByDepartmentValidator,
  getResourceRequestByIdValidator,
  deleteResourceRequestValidator,
  decideResourceRequestValidator,
  updateDepartmentBudgetValidator
} = require('../validators/resourceRequestValidator');
const { validateResult } = require('../utils/validatorHelpers');
const {
  resourceRequestCommandController,
  resourceRequestQueryController
} = require('../config/container');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lecturas) ---

// Consultar mis solicitudes (cualquier rol autenticado)
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

// Consultar presupuesto del departamento
router.get(
  '/department/budget',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  resourceRequestQueryController.getBudget
);

// Consultar reporte mensual del departamento
router.get(
  '/department/report',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  resourceRequestQueryController.getReport
);

// Consultar detalle de solicitud por ID
router.get(
  '/:id',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR, UserRole.SOPORTE_TECNICO]),
  getResourceRequestByIdValidator,
  validateResult,
  resourceRequestQueryController.getById
);

// --- CQRS COMMANDS (Escrituras) ---

// Crear solicitud de recurso (Colaborador, Soporte, Gerente o Administrador)
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR, UserRole.SOPORTE_TECNICO]),
  createResourceRequestValidator,
  validateResult,
  resourceRequestCommandController.create
);

// Ajustar presupuesto del departamento (Gerente o Administrador)
router.put(
  '/department/budget',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  updateDepartmentBudgetValidator,
  validateResult,
  resourceRequestCommandController.updateBudget
);

// Decisión de aprobación / rechazo (Gerente o Administrador)
router.patch(
  '/:id/decision',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  decideResourceRequestValidator,
  validateResult,
  resourceRequestCommandController.decide
);

// Eliminación lógica (soft delete) de solicitud
router.delete(
  '/:id',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR, UserRole.SOPORTE_TECNICO]),
  deleteResourceRequestValidator,
  validateResult,
  resourceRequestCommandController.delete
);

module.exports = router;
