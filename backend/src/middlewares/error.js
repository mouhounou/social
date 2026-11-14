const AppError = require("../utils/AppError");

function notFound(req, res) {
  res.status(404).json({ message: `Route introuvable : ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Erreur serveur";
  // Champ du formulaire concerné, pour que le client le signale directement.
  let field = err instanceof AppError ? err.field : undefined;

  if (err.name === "ValidationError") {
    status = 400;
    [field] = Object.keys(err.errors);
    message = err.errors[field].message;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Identifiant invalide";
  } else if (err.code === 11000) {
    status = 409;
    [field] = Object.keys(err.keyValue);
    message = field === "email" ? "Cet email est déjà utilisé" : "Ce nom d'utilisateur est déjà pris";
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image trop lourde (5 Mo max)" : "Envoi de fichier invalide";
  }

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON invalide";
  }

  if (status >= 500 && !(err instanceof AppError)) {
    console.error(err);
    if (!err.expose) message = "Erreur serveur, réessaie plus tard";
  }
  res.status(status).json({ message, ...(field && { field }) });
}

module.exports = { notFound, errorHandler };
