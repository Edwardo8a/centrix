const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../../core/enums/UserRole');

const router = express.Router();

router.use(authMiddleware);
router.use(roleCheck([UserRole.ADMINISTRADOR]));

router.get('/reports', AdminController.getReports);
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
