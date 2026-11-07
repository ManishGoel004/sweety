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

module.exports = { SLOTS, SLOT_KEYS, MIN_VALUE, MAX_VALUE, MAX_READINGS_PER_DAY };
