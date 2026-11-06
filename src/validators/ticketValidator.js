const { body, param, query } = require('express-validator');
const { normalizeTicketStatus } = require('../enums/TicketStatus');
const { normalizeTicketPriority, MAX_LIMIT } = require('../queries/tickets/GetAllTicketsHandler');
const {
  normalizeAttachmentFormat,
  isValidBucketFileUrl,
  MAX_ATTACHMENT_SIZE_BYTES
} = require('../commands/tickets/AddTicketAttachmentHandler');

// Validador para la creacion de tickets
const ticketValidator = [
  body('title').notEmpty().withMessage('El titulo es obligatorio'),
  body('description').notEmpty().withMessage('La descripcion es obligatoria'),
  body('priority').notEmpty().withMessage('La prioridad es obligatoria'),
  body('department_id').notEmpty().withMessage('El departamento es obligatorio')
];

// Validador para consulta global de tickets (administrador)
const getAllTicketsValidator = [
  query('status')
    .optional()
    .isString()
    .withMessage('El estado debe ser una cadena de texto')
    .bail()
    .custom((value) => Boolean(normalizeTicketStatus(value)))
    .withMessage('El estado proporcionado no es válido'),
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido'),
  query('priority')
    .optional()
    .isString()
    .withMessage('La prioridad debe ser una cadena de texto')
    .bail()
    .custom((value) => Boolean(normalizeTicketPriority(value)))
    .withMessage('La prioridad debe ser Baja, Media, Alta o Critica'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El parámetro page debe ser un entero mayor o igual a 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_LIMIT })
    .withMessage(`El parámetro limit debe ser un entero entre 1 y ${MAX_LIMIT}`)
];

// Validador para consulta de detalle de un ticket por ID
const getTicketByIdValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID del ticket debe ser un UUID válido')
];

// Validador para consulta de tickets por departamento
const getTicketsByDepartmentValidator = [
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento debe ser un UUID válido')
];

// Validador para la actualizacion de estado de tickets
const updateTicketStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID del ticket debe ser un UUID válido'),
  body('status')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isString()
    .withMessage('El estado debe ser una cadena de texto'),
  body('comment')
    .optional()
    .isString()
    .withMessage('El comentario debe ser una cadena de texto')
];

// Validador para la asignacion de tickets
const assignTicketValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID del ticket debe ser un UUID válido'),
  body('assigned_to')
    .notEmpty()
    .withMessage('El usuario a asignar es obligatorio')
    .bail()
    .isUUID()
    .withMessage('El ID del usuario a asignar debe ser un UUID válido')
];

// Validador para adjuntar evidencias a un ticket
const addTicketAttachmentValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID del ticket debe ser un UUID válido'),
  body('file_url')
    .notEmpty()
    .withMessage('La ruta del archivo (file_url) es obligatoria')
    .bail()
    .isString()
    .withMessage('La ruta del archivo (file_url) debe ser una cadena de texto')
    .bail()
    .custom((value) => isValidBucketFileUrl(value))
    .withMessage('La ruta file_url no pertenece al bucket de evidencias configurado'),
  body('file_format')
    .notEmpty()
    .withMessage('El formato del archivo (file_format) es obligatorio')
    .bail()
    .isString()
    .withMessage('El formato del archivo debe ser una cadena de texto')
    .bail()
    .custom((value) => Boolean(normalizeAttachmentFormat(value)))
    .withMessage('Formato de archivo no permitido. Formatos válidos: jpg, jpeg, png, webp, pdf'),
  body('size_bytes')
    .notEmpty()
    .withMessage('El tamaño del archivo (size_bytes) es obligatorio')
    .bail()
    .isInt({ min: 1, max: MAX_ATTACHMENT_SIZE_BYTES })
    .withMessage(
      `El tamaño del archivo debe ser un entero entre 1 y ${MAX_ATTACHMENT_SIZE_BYTES} bytes (5 MB)`
    )
];

// Validador para la eliminacion de tickets
const deleteTicketValidator = [
  param('id')
    .isUUID()
    .withMessage('El ID del ticket debe ser un UUID válido')
];

module.exports = {
  ticketValidator,
  getAllTicketsValidator,
  getTicketByIdValidator,
  getTicketsByDepartmentValidator,
  updateTicketStatusValidator,
  assignTicketValidator,
  addTicketAttachmentValidator,
  deleteTicketValidator
};
