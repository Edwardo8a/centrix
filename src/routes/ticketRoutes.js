const express = require('express');
const { param } = require('express-validator');
const ticketCommandControllerFactory = require('../controllers/TicketCommandController');
const TicketQueryController = require('../controllers/TicketQueryController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const { ticketValidator } = require('../validators/ticketValidator');
const { validateResult } = require('../utils/validatorHelpers');
const { createTicketHandler } = require('../config/container');

const router = express.Router();
const ticketCommandController = ticketCommandControllerFactory({ createTicketHandler });


router.use(authMiddleware);

// --- CQRS QUERIES (Lecturas) ---
router.get(
  '/department/:departmentId',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  param('departmentId').isUUID().withMessage('El ID del departamento debe ser un UUID válido'),
  validateResult,
  TicketQueryController.getByDepartment
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

module.exports = router;
