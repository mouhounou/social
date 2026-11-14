require("dotenv").config({ quiet: true });

const app = require("./src/app");
const connectDB = require("./src/config/db");
const turnstile = require("./src/middlewares/turnstile");

const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables manquantes dans .env : ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    console.error("JWT_SECRET doit faire au moins 32 caractères en production");
    process.exit(1);
  }
  console.warn("JWT_SECRET est court : utilise au moins 32 caractères aléatoires");
}

if (turnstile.enabled() && !turnstile.allowedHostnames().size) {
  console.error("TURNSTILE_HOSTNAMES est requis avec TURNSTILE_SECRET : indique le domaine du site (ex. solola.app)");
  process.exit(1);
}
if (!turnstile.enabled() && process.env.NODE_ENV === "production") {
  console.warn("TURNSTILE_SECRET est absent : la protection anti-robots est inactive");
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API Solola sur http://localhost:${PORT}`));
});
