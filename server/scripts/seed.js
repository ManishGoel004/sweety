// Creates a demo user with sample readings for the previous month and this month (up to today).
// Safe to run again: it deletes the old demo user (and their readings) first.
//
//   Email:    demo@sweety.app
//   Password: demo1234

const bcrypt = require('bcrypt');
const db = require('../src/db');
const { SLOT_KEYS } = require('../src/constants');
const { pad } = require('../src/utils/dates');

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.app', password: 'demo1234' };

// Simple seeded random numbers, so every run creates the same sample data
let seed = 42;
function random() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randomBetween(min, max) {
  return Math.round(min + random() * (max - min));
}

// Realistic-looking values: fasting is lower, after meals is higher
function sampleValue(slot) {
  const roll = random();
  if (roll < 0.05) return randomBetween(55, 69); // occasional low
  if (roll > 0.92) return randomBetween(200, 280); // occasional high
  return slot === 'morning_fasting' ? randomBetween(85, 130) : randomBetween(110, 180);
}

function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function seedDemo() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM users WHERE email = $1', [DEMO.email]);
    const passwordHash = await bcrypt.hash(DEMO.password, 10);
    const { rows } = await client.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [DEMO.name, DEMO.email, passwordHash]
    );
    const userId = rows[0].id;

    // From the 1st of last month up to today
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    let count = 0;

    while (day <= today) {
      // Most days have all 4 readings, some have fewer, a few are skipped.
      // Today always has the first 2 readings, so the daily report has data in a demo.
      const roll = random();
      const isToday = toDateString(day) === toDateString(today);
      let slotsToday;
      if (isToday) slotsToday = SLOT_KEYS.slice(0, 2);
      else if (roll < 0.1) slotsToday = [];
      else if (roll < 0.3) slotsToday = SLOT_KEYS.slice(0, 2);
      else slotsToday = SLOT_KEYS;

      for (const slot of slotsToday) {
        await client.query(
          'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
          [userId, toDateString(day), slot, sampleValue(slot)]
        );
        count++;
      }
      day.setDate(day.getDate() + 1);
    }

    await client.query('COMMIT');
    console.log(`Seeded demo user ${DEMO.email} / ${DEMO.password} with ${count} readings`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seedDemo()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
