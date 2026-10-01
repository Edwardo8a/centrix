const express = require('express');
const DepartmentQueryController = require('../controllers/DepartmentQueryController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// todas las rutas de departamentos requieren autenticación:
router.use(authMiddleware);

// GET /api/departments
router.get('/', DepartmentQueryController.getAll);

module.exports = router;
