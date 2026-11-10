const cloudinary = require("cloudinary").v2;
const AppError = require("../utils/AppError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBuffer(buffer, folder) {
  if (!process.env.CLOUDINARY_API_KEY) {
    return Promise.reject(new AppError("L'envoi d'images n'est pas configuré sur le serveur", 503));
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

async function removeImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Suppression Cloudinary échouée :", err.message);
  }
}

module.exports = { cloudinary, uploadBuffer, removeImage };
