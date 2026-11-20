const os = require("os");
const fs = require("fs/promises");
const multer = require("multer");
const AppError = require("../utils/AppError");
const { MAX_PARAGRAPHS, VIDEO_MAX, IMAGE_TYPES, VIDEO_TYPES } = require("../utils/media");

// Fichiers d'une publication : `image` (couverture) et `media` (un par paragraphe, image ou vidéo).
// Ils passent par le disque et non par la mémoire, à cause des vidéos.
const parser = multer({
  dest: os.tmpdir(),
  limits: { fileSize: VIDEO_MAX, files: MAX_PARAGRAPHS + 1, fields: 20, fieldSize: 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.fieldname === "image" && !IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError("Format d'image non accepté (JPEG, PNG, WebP, GIF ou AVIF)", 400, "image"));
    }
    if (file.fieldname === "media" && !IMAGE_TYPES.includes(file.mimetype) && !VIDEO_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError("Format non accepté : image JPEG, PNG, WebP, GIF, AVIF ou vidéo MP4, WebM, MOV", 400, "paragraphs")
      );
    }
    cb(null, true);
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "media", maxCount: MAX_PARAGRAPHS },
]);

function removeTempFiles(files) {
  const all = Object.values(files || {}).flat();
  return Promise.all(all.map((f) => fs.unlink(f.path).catch(() => {})));
}

function postUpload(req, res, next) {
  // Les fichiers temporaires sont effacés une fois la réponse partie, qu'elle soit un succès ou une erreur.
  res.on("close", () => removeTempFiles(req.files));
  parser(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Fichier trop lourd : 5 Mo au plus pour une image, 50 Mo pour une vidéo"));
    }
    next(err);
  });
}

module.exports = postUpload;
