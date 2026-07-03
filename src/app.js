const config = require("./config");
const { ensureAdmin } = require("./controllers");

async function bootstrap() {
  await ensureAdmin();
}

module.exports = { bootstrap };
