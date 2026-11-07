// Runs every .sql file in /migrations in name order.
// Each file uses IF NOT EXISTS, so running it twice is safe.
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function migrate() {
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await db.query(sql);
    console.log(`Applied ${file}`);
  }
}

// Allow both `npm run migrate` and require() from the tests
if (require.main === module) {
  migrate()
    .then(() => console.log('Migrations done'))
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => db.pool.end());
}

module.exports = migrate;
