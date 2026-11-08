import { SLOTS, MIN_VALUE, MAX_VALUE } from './constants';
import { todayString } from './utils';

/**
 * Same rules and messages as the server, so the user sees the error
 * immediately. Returns an error message, or '' if the reading is valid.
 * (The "one per slot" and "max 4 per day" rules need the database,
 * so those messages come from the server.)
 */
export function validateReading({ date, slot, value }, today = todayString()) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Please enter a glucose value.';
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < MIN_VALUE || number > MAX_VALUE) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }
  if (!SLOTS[slot]) {
    return 'Please select a time slot.';
  }
  if (!date) {
    return 'Please select a date.';
  }
  if (date > today) {
    return 'Date cannot be in the future.';
  }
  return '';
}
