const app = require("./app");
const { PORT } = require("./config/environment");

app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
