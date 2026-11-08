const pad = (n) => String(n).padStart(2, '0');

// Today's date as 'YYYY-MM-DD' in the user's local time
export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// '2026-11-08' -> '8 Nov 2026'
export function formatDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
