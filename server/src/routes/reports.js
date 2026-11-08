const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError } = require('../middleware/errorHandler');
const { REPORT_TYPES, getReportRange } = require('../utils/dateRanges');
const { todayString, isValidDateString } = require('../utils/dates');

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
            ROUND(AVG(value)::numeric, 1)  AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [req.user.id, from, to]
  );
  const { count, highest, lowest, average } = stats.rows[0];

  const report = {
    type,
    range: { from, to },
    count,
    highest,
    lowest,
    // PostgreSQL returns NUMERIC as a string ("123.5"), so convert it to a number
    average: average === null ? null : Number(average),
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

module.exports = router;
