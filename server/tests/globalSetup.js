// Runs once before all test files: makes sure the test database has the tables.
// NODE_ENV=test (set by `npm test`) makes db.js use TEST_DATABASE_URL.
module.exports = async () => {
  const migrate = require('../scripts/migrate');
  const db = require('../src/db');
  await migrate();
  await db.pool.end();
};
