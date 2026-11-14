class AppError extends Error {
  constructor(message, status = 400, field) {
    super(message);
    this.status = status;
    if (field) this.field = field;
  }
}

module.exports = AppError;
