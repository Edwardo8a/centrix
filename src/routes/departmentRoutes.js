const express = require('express');
const { departmentQueryController } = require('../config/container');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

// --- CQRS QUERIES (Lectura) ---
// HU-13: Obtener departamentos
router.get('/', departmentQueryController.getAll);

module.exports = router;
