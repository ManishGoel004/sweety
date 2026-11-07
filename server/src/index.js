const app = require('./app');
const config = require('./config');

if (!config.jwtSecret) {
  console.error('JWT_SECRET is missing. Copy .env.example to server/.env first.');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`Sweety API running on http://localhost:${config.port}`);
});
