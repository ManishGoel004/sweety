const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError } = require('../middleware/errorHandler');
const { REPORT_TYPES, getReportRange, getMonthRange } = require('../utils/dateRanges');
const { todayString, isValidDateString } = require('../utils/dates');
const { TARGET_LOW, TARGET_HIGH } = require('../constants');

const router = express.Router();
router.use(requireAuth);

// GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const type = req.query.type || 'daily';
  const date = req.query.date || todayString();

  if (!REPORT_TYPES.includes(type)) {
    throw new HttpError(400, 'Report type must be daily, mtd or monthly.');
  }
  if (!isValidDateString(date)) {
    throw new HttpError(400, 'Please select a valid date.');
  }

  const { from, to } = getReportRange(type, date);

  const stats = await db.query(
    `SELECT COUNT(*)::int                  AS count,
            MAX(value)                     AS highest,
            MIN(value)                     AS lowest,
            ROUND(AVG(value)::numeric, 1)  AS average,
            COUNT(*) FILTER (WHERE value BETWEEN $4 AND $5)::int AS in_range
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [req.user.id, from, to, TARGET_LOW, TARGET_HIGH]
  );
  const { count, highest, lowest, average, in_range: inRange } = stats.rows[0];

  const report = {
    type,
    range: { from, to },
    count,
    highest,
    lowest,
    // PostgreSQL returns NUMERIC as a string ("123.5"), so convert it to a number
    average: average === null ? null : Number(average),
    // Extra: % of readings inside the usual target range (70 - 180 mg/dl)
    inRangePercent: count === 0 ? null : Math.round((inRange / count) * 100),
  };

  // The daily report also lists each reading with its slot
  if (type === 'daily') {
    const readings = await db.query(
      `SELECT id, slot, value FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner']::varchar[], slot)`,
      [req.user.id, date]
    );
    report.readings = readings.rows;
  }

  res.json(report);
});

// GET /api/reports/chart?date=YYYY-MM-DD
// All readings in the calendar month of the date, for the line chart
router.get('/chart', async (req, res) => {
  const date = req.query.date || todayString();
  if (!isValidDateString(date)) {
    throw new HttpError(400, 'Please select a valid date.');
  }

  const { from, to } = getMonthRange(date);
  const result = await db.query(
    `SELECT reading_date AS date, slot, value FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     ORDER BY reading_date`,
    [req.user.id, from, to]
  );

  res.json({ range: { from, to }, readings: result.rows });
});

module.exports = router;
