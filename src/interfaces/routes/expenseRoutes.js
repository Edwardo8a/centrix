const express = require('express');
const ExpenseCommandController = require('../controllers/ExpenseCommandController');
const ExpenseQueryController = require('../controllers/ExpenseQueryController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../../core/enums/UserRole');
const { expenseValidator } = require('../validators/expenseValidator');
const { validateResult } = require('../../utils/validatorHelpers');

const router = express.Router();

router.use(authMiddleware);

// --- READ QUERIES (Flutter ViewModels) ---
router.get('/my-expenses', ExpenseQueryController.getMyExpenses);
router.get('/pending', roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]), ExpenseQueryController.getPending);

// --- WRITE COMMANDS (ACID Mutations) ---
router.post(
  '/',
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  expenseValidator,
  validateResult,
  ExpenseCommandController.create
);

router.patch(
  '/:expenseId/status',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  ExpenseCommandController.updateStatus
);

module.exports = router;
