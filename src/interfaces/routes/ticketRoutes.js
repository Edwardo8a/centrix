const express = require('express');
const TicketCommandController = require('../controllers/TicketCommandController');
const TicketQueryController = require('../controllers/TicketQueryController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../../core/enums/UserRole');
const { ticketValidator, updateTicketStatusValidator } = require('../validators/ticketValidator');
const { validateResult } = require('../../utils/validatorHelpers');

const router = express.Router();

router.use(authMiddleware);

// Rutas de consulta (Read Queries para ViewModels de Flutter)
router.get('/my-tickets', TicketQueryController.getMyTickets);
router.get('/pending', roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]), TicketQueryController.getPending);
router.get('/department/:departmentId', roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]), TicketQueryController.getAllTicketsByDepartment);
router.get('/:ticketId', TicketQueryController.getById);

// Rutas de comandos de escritura (Write Commands)
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  ticketValidator,
  validateResult,
  TicketCommandController.create
);

// HU-05: Actualizacion de estado de ticket (Administrador, Gerente y Soporte Tecnico)
router.patch(
  '/:ticketId/status',
  roleCheck([
    UserRole.GERENTE,
    UserRole.ADMINISTRADOR,
    UserRole.SOPORTE_TECNICO,
    UserRole.SOPORTE
  ]),
  updateTicketStatusValidator,
  validateResult,
  TicketCommandController.updateStatus
);

router.post(
  '/:ticketId/assign',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  TicketCommandController.assign
);

module.exports = router;
