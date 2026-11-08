// The 4 time slots, in the order they happen during the day.
// The key is stored in the DB; the label is shown to users.
const SLOTS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const SLOT_KEYS = Object.keys(SLOTS);

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const MAX_READINGS_PER_DAY = 4;

// Usual target range (general guideline, not medical advice)
const TARGET_LOW = 70;
const TARGET_HIGH = 180;

function getStatus(value) {
  if (value < TARGET_LOW) return 'Low';
  if (value > TARGET_HIGH) return 'High';
  return 'Normal';
}

module.exports = {
  SLOTS,
  SLOT_KEYS,
  MIN_VALUE,
  MAX_VALUE,
  MAX_READINGS_PER_DAY,
  TARGET_LOW,
  TARGET_HIGH,
  getStatus,
};
