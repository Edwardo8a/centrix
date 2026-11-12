const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const { getSolversValidator, deviceTokenValidator } = require('../validators/userValidator');
const { validateResult } = require('../utils/validatorHelpers');
const { userQueryController } = require('../config/container');
const notificationService = require('../services/NotificationService');
const ResponseBuilder = require('../utils/responseBuilder');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/solvers',
  roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  getSolversValidator,
  validateResult,
  userQueryController.getSolvers
);

// Registrar o actualizar token de dispositivo FCM
router.post(
  '/device-token',
  deviceTokenValidator,
  validateResult,
  async (req, res, next) => {
    try {
      const { fcm_token, platform, device_name } = req.body;
      const result = await notificationService.registerDeviceToken({
        userId: req.user.id,
        fcmToken: fcm_token,
        platform: platform || 'android',
        deviceName: device_name || null
      });
      return ResponseBuilder.success(res, result, 'Token de dispositivo registrado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
);

// Desregistrar token al cerrar sesión
router.delete(
  '/device-token',
  async (req, res, next) => {
    try {
      const { fcm_token } = req.body;
      if (fcm_token) {
        await notificationService.unregisterDeviceToken({
          userId: req.user.id,
          fcmToken: fcm_token
        });
      }
      return ResponseBuilder.success(res, null, 'Token de dispositivo eliminado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

