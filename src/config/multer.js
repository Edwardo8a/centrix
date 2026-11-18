const multer = require('multer');
const BusinessError = require('../exceptions/BusinessError');

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'video/mp4']);

const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_EVIDENCE_BYTES, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new BusinessError('Solo se aceptan imágenes JPEG, PNG o videos MP4', 400));
    }
    callback(null, true);
  }
});

module.exports = { evidenceUpload, MAX_EVIDENCE_BYTES };
