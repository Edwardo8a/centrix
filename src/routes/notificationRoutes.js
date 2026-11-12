const express = require('express');
const authMiddleware = require('../middlewares/auth');
const notificationService = require('../services/NotificationService');
const ResponseBuilder = require('../utils/responseBuilder');

const router = express.Router();

router.use(authMiddleware);

// GET /api/notifications -> listar notificaciones del usuario autenticado
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const offset = parseInt(req.query.offset, 10) || 0;

    const notifications = await notificationService.getUserNotifications({
      userId: req.user.id,
      limit,
      offset,
    });

    return ResponseBuilder.success(res, notifications, 'Notificaciones obtenidas correctamente', 200);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read -> marcar notificación como leída
router.patch('/:id/read', async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead({
      userId: req.user.id,
      notificationId: req.params.id,
    });

    return ResponseBuilder.success(res, updated, 'Notificación marcada como leída', 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
