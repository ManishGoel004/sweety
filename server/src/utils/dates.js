// Dates are handled as 'YYYY-MM-DD' strings (calendar days, no time, no timezone).

function pad(n) {
  return String(n).padStart(2, '0');
}

// Today's date in the server's local time, e.g. '2026-11-07'
function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// true for real calendar dates like '2026-02-28', false for '2026-02-30' or 'hello'
function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

module.exports = { pad, todayString, isValidDateString };
