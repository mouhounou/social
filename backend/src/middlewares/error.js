const AppError = require("../utils/AppError");

function notFound(req, res) {
  res.status(404).json({ message: `Route introuvable : ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Erreur serveur";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)[0].message;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Identifiant invalide";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue)[0];
    message = field === "email" ? "Cet email est déjà utilisé" : "Ce nom d'utilisateur est déjà pris";
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image trop lourde (5 Mo max)" : err.message;
  }

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON invalide";
  }

  if (status >= 500 && !(err instanceof AppError)) {
    console.error(err);
    if (!err.expose) message = "Erreur serveur, réessaie plus tard";
  }
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
