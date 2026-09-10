const express = require('express');
const TicketCommandController = require('../controllers/TicketCommandController');
const TicketQueryController = require('../controllers/TicketQueryController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../../core/enums/UserRole');
const { ticketValidator } = require('../validators/ticketValidator');
const { validateResult } = require('../../utils/validatorHelpers');

const router = express.Router();

router.use(authMiddleware);

// --- READ QUERIES (Flutter ViewModels) ---
router.get('/my-tickets', TicketQueryController.getMyTickets);
router.get('/pending', roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]), TicketQueryController.getPending);
router.get('/:ticketId', TicketQueryController.getById);

// --- WRITE COMMANDS (ACID Mutations) ---
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  ticketValidator,
  validateResult,
  TicketCommandController.create
);

router.patch(
  '/:ticketId/status',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  TicketCommandController.updateStatus
);

router.post(
  '/:ticketId/assign',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  TicketCommandController.assign
);

module.exports = router;
