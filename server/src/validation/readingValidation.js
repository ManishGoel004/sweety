const db = require('../db');
const { SLOTS, MIN_VALUE, MAX_VALUE, MAX_READINGS_PER_DAY } = require('../constants');
const { todayString, isValidDateString } = require('../utils/dates');

const MESSAGES = {
  valueRequired: 'Please enter a glucose value.',
  valueRange: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
  dateInvalid: 'Please select a valid date.',
  dateFuture: 'Date cannot be in the future.',
  slotInvalid: 'Please select a valid time slot.',
  maxPerDay: `You can add only ${MAX_READINGS_PER_DAY} readings per day.`,
  duplicateSlot: (slot) => `You already have ${withArticle(SLOTS[slot])} reading for this date.`,
};

// "an After lunch", but "a Morning (fasting)"
function withArticle(label) {
  return /^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`;
}

/**
 * Checks the fields of a reading (no database needed).
 * Returns { error } if something is wrong, otherwise { data } with clean values.
 */
function validateReadingInput({ date, slot, value } = {}, today = todayString()) {
  // 1. Value is required
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: MESSAGES.valueRequired };
  }

  // 2. Value must be a whole number between 40 and 600
  const number = Number(value);
  if (typeof value === 'boolean' || !Number.isInteger(number) || number < MIN_VALUE || number > MAX_VALUE) {
    return { error: MESSAGES.valueRange };
  }

  // 3. Slot must be one of the 4 slots
  if (!Object.prototype.hasOwnProperty.call(SLOTS, slot)) {
    return { error: MESSAGES.slotInvalid };
  }

  // 4. Date must be a real date and not in the future
  if (!isValidDateString(date)) {
    return { error: MESSAGES.dateInvalid };
  }
  // 'YYYY-MM-DD' strings can be compared directly
  if (date > today) {
    return { error: MESSAGES.dateFuture };
  }

  return { data: { date, slot, value: number } };
}

/**
 * Rules that need the database: max 4 readings per day and one reading per slot.
 * excludeId is the reading being edited, so it does not count against itself.
 * Returns an error message, or null if everything is fine.
 */
async function checkDayRules(userId, date, slot, excludeId = null) {
  const result = await db.query(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId]
  );
  const slotsTaken = result.rows.map((row) => row.slot);

  if (slotsTaken.length >= MAX_READINGS_PER_DAY) return MESSAGES.maxPerDay;
  if (slotsTaken.includes(slot)) return MESSAGES.duplicateSlot(slot);
  return null;
}

module.exports = { validateReadingInput, checkDayRules, MESSAGES };
