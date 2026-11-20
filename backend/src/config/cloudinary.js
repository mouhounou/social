const cloudinary = require("cloudinary").v2;
const AppError = require("../utils/AppError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Formats acceptés à l'arrivée sur Cloudinary, même pour un fichier récupéré par lien (pas de SVG).
const FORMATS = {
  image: ["jpg", "png", "webp", "gif", "avif"],
  video: ["mp4", "webm", "mov"],
};

function ensureConfigured(message = "L'envoi d'images n'est pas configuré sur le serveur") {
  if (!process.env.CLOUDINARY_API_KEY) throw new AppError(message, 503);
}

function uploadBuffer(buffer, folder) {
  try {
    ensureConfigured();
  } catch (err) {
    return Promise.reject(err);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `solola/${folder}`, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Envoie une image ou une vidéo sur Cloudinary. `source` est le chemin d'un fichier reçu,
 * ou un lien http(s) : Cloudinary va alors chercher le fichier lui-même.
 * Un fichier refusé (format, lien mort, page web au lieu d'un fichier) donne une AppError `rejected`.
 */
async function uploadMedia(source, folder, type) {
  ensureConfigured("L'envoi d'images et de vidéos n'est pas configuré sur le serveur");
  try {
    const result = await cloudinary.uploader.upload(source, {
      folder: `solola/${folder}`,
      resource_type: type,
      allowed_formats: FORMATS[type],
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    if (err.http_code === 499) throw new AppError("Le service des médias n'a pas répondu à temps, réessaie", 504);
    if ([400, 404, 415].includes(err.http_code)) {
      const rejected = new AppError("Média refusé par le service des médias");
      rejected.rejected = true;
      throw rejected;
    }
    throw err;
  }
}

async function removeMedia(publicId, type = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  } catch (err) {
    console.warn("Suppression Cloudinary échouée :", err.message);
  }
}

const removeImage = (publicId) => removeMedia(publicId, "image");

module.exports = { cloudinary, uploadBuffer, uploadMedia, removeMedia, removeImage };
