require("dotenv").config({ quiet: true });

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API Solola sur http://localhost:${PORT}`));
});
