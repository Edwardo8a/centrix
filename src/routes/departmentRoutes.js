const express = require('express');
const DepartmentQueryController = require('../controllers/DepartmentQueryController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lectura) ---
// HU-13: Obtener departamentos
router.get('/', DepartmentQueryController.getAll);

module.exports = router;
