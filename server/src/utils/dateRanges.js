const { pad } = require('./dates');

const REPORT_TYPES = ['daily', 'mtd', 'monthly'];

// Number of days in a month (month is 1-12). Day 0 of the next month = last day of this month.
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Returns the { from, to } date range for a report, based on the selected date.
 *   daily   -> the selected date only               (15 Oct -> 15 Oct - 15 Oct)
 *   mtd     -> 1st of the month to the selected date (15 Oct -> 1 Oct - 15 Oct)
 *   monthly -> the whole previous month             (15 Oct -> 1 Sep - 30 Sep)
 */
function getReportRange(type, date) {
  const [year, month] = date.split('-').map(Number);

  if (type === 'daily') {
    return { from: date, to: date };
  }

  if (type === 'mtd') {
    return { from: `${year}-${pad(month)}-01`, to: date };
  }

  if (type === 'monthly') {
    // January -> December of the previous year
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const lastDay = daysInMonth(prevYear, prevMonth);
    return {
      from: `${prevYear}-${pad(prevMonth)}-01`,
      to: `${prevYear}-${pad(prevMonth)}-${pad(lastDay)}`,
    };
  }

  throw new Error(`Unknown report type: ${type}`);
}

module.exports = { REPORT_TYPES, getReportRange, daysInMonth };
