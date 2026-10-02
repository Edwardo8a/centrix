const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');

const router = express.Router();

router.use(authMiddleware);
router.use(roleCheck([UserRole.ADMINISTRADOR]));

// HU-11: Creacion de usuario por administrador
router.post('/users', AdminController.createUser);

// HU-12 / PPS-42: Asignacion de multiples roles a un usuario
router.put('/users/:userId/roles', AdminController.updateUserRoles);

module.exports = router;
