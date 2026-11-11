const multer = require("multer");
const AppError = require("../utils/AppError");

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2, fields: 20, fieldSize: 64 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new AppError("Format d'image non accepté (JPEG, PNG, WebP, GIF ou AVIF)"));
    }
    cb(null, true);
  },
});

module.exports = upload;
