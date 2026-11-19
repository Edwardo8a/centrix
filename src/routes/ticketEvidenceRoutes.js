const express = require('express');
const { param } = require('express-validator');
const auth = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const UserRole = require('../enums/UserRole');
const { validateResult } = require('../utils/validatorHelpers');
const { evidenceUpload } = require('../config/multer');
const ResponseBuilder = require('../utils/responseBuilder');
const { attachTicketEvidenceHandler, getTicketEvidencesQuery, getPendingTicketsHandler } = require('../config/container');

const router = express.Router();
const ticketId = () => param('ticketId').isUUID().withMessage('El ID del ticket debe ser un UUID válido');

router.get('/pending', auth, roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]), async (req, res, next) => {
  try {
    const data = await getPendingTicketsHandler.handle({ user: req.user });
    return ResponseBuilder.success(res, data, 'Tickets pendientes obtenidos');
  } catch (error) { next(error); }
});

router.get('/:ticketId/evidences', auth, ticketId(), validateResult, async (req, res, next) => {
  try {
    const data = await getTicketEvidencesQuery.execute({ ticketId: req.params.ticketId, user: req.user });
    return ResponseBuilder.success(res, data, 'Evidencias obtenidas');
  } catch (error) { next(error); }
});

router.post('/:ticketId/evidences', auth,
  roleCheck([UserRole.COLABORADOR, UserRole.GERENTE, UserRole.ADMINISTRADOR]),
  ticketId(), validateResult, evidenceUpload.single('file'), async (req, res, next) => {
    try {
      const data = await attachTicketEvidenceHandler.handle({ ticketId: req.params.ticketId, user: req.user, file: req.file });
      return ResponseBuilder.success(res, data, 'Evidencia guardada', 201);
    } catch (error) { next(error); }
  });

module.exports = router;
