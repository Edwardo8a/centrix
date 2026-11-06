const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const {
  ticketValidator,
  getAllTicketsValidator,
  getTicketByIdValidator,
  getTicketsByDepartmentValidator,
  updateTicketStatusValidator,
  assignTicketValidator,
  addTicketAttachmentValidator,
  deleteTicketValidator
} = require('../validators/ticketValidator');
const { validateResult } = require('../utils/validatorHelpers');
const {
  ticketCommandController,
  ticketQueryController
} = require('../config/container');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lecturas) ---
router.get(
  '/',
  roleCheck([UserRole.ADMINISTRADOR]),
  getAllTicketsValidator,
  validateResult,
  ticketQueryController.getAll
);

router.get(
  '/mine',
  ticketQueryController.getMine
);

router.get(
  '/assigned',
  roleCheck([UserRole.SOPORTE_TECNICO, UserRole.ADMINISTRADOR]),
  ticketQueryController.getAssigned
);

router.get(
  '/department',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getTicketsByDepartmentValidator,
  validateResult,
  ticketQueryController.getByDepartment
);

router.get(
  '/:id',
  roleCheck([
    UserRole.COLABORADOR,
    UserRole.SOPORTE_TECNICO,
    UserRole.GERENTE,
    UserRole.ADMINISTRADOR
  ]),
  getTicketByIdValidator,
  validateResult,
  ticketQueryController.getById
);

// --- CQRS COMMANDS (Escrituras) ---
// HU-03: Creacion de tickets
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  ticketValidator,
  validateResult,
  ticketCommandController.create
);

// Registro de evidencias (adjuntos) en un ticket
router.post(
  '/:id/attachments',
  roleCheck([
    UserRole.COLABORADOR,
    UserRole.SOPORTE_TECNICO,
    UserRole.GERENTE,
    UserRole.ADMINISTRADOR
  ]),
  addTicketAttachmentValidator,
  validateResult,
  ticketCommandController.addAttachment
);

// Eliminacion de ticket (borrado logico)
router.delete(
  '/:id',
  roleCheck([UserRole.ADMINISTRADOR]),
  deleteTicketValidator,
  validateResult,
  ticketCommandController.delete
);

// Actualizacion de estado de ticket
router.patch(
  '/:id/status',
  roleCheck([UserRole.GERENTE, UserRole.SOPORTE_TECNICO, UserRole.ADMINISTRADOR]),
  updateTicketStatusValidator,
  validateResult,
  ticketCommandController.changeStatus
);

// Asignacion de ticket a soporte_tecnico
router.patch(
  '/:id/assign',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  assignTicketValidator,
  validateResult,
  ticketCommandController.assign
);

module.exports = router;
