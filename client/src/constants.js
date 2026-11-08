// Same slots and limits as the server (server/src/constants.js)
export const SLOTS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;

// Usual target range (general guideline, not medical advice)
export const TARGET_LOW = 70;
export const TARGET_HIGH = 180;

export function getStatus(value) {
  if (value < TARGET_LOW) return 'Low';
  if (value > TARGET_HIGH) return 'High';
  return 'Normal';
}
