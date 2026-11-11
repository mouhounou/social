require("dotenv").config({ quiet: true });

const app = require("./src/app");
const connectDB = require("./src/config/db");

const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variables manquantes dans .env : ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API Solola sur http://localhost:${PORT}`));
});
