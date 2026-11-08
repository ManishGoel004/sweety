const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError } = require('../middleware/errorHandler');
const { validateReadingInput, checkDayRules } = require('../validation/readingValidation');

const router = express.Router();

// Every readings route needs a logged-in user
router.use(requireAuth);

// Sort readings by date (newest first), then by slot in the order of the day
const ORDER_BY = `
  ORDER BY reading_date DESC,
  array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner']::varchar[], slot)
`;

const COLUMNS = 'id, reading_date AS date, slot, value, created_at, updated_at';

// Runs all validation rules and throws a 400 with a friendly message if one fails
async function validateReading(body, userId, excludeId = null) {
  const { error, data } = validateReadingInput(body);
  if (error) throw new HttpError(400, error);

  const dayError = await checkDayRules(userId, data.date, data.slot, excludeId);
  if (dayError) throw new HttpError(400, dayError);

  return data;
}

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Reading not found.');
  return id;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Reads ?page= and ?limit= (whole numbers from 1), using defaults when missing
function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    throw new HttpError(400, 'page and limit must be whole numbers of 1 or more.');
  }
  return { page, limit: Math.min(limit, MAX_LIMIT) };
}

// GET /api/readings?page=1&limit=20 - only the logged-in user's readings, newest first
router.get('/', async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const offset = (page - 1) * limit;

  const [rows, count] = await Promise.all([
    db.query(`SELECT ${COLUMNS} FROM readings WHERE user_id = $1 ${ORDER_BY} LIMIT $2 OFFSET $3`, [
      req.user.id,
      limit,
      offset,
    ]),
    db.query('SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1', [req.user.id]),
  ]);

  const total = count.rows[0].total;
  res.json({
    data: rows.rows,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// POST /api/readings
router.post('/', async (req, res) => {
  const { date, slot, value } = await validateReading(req.body, req.user.id);

  const result = await db.query(
    `INSERT INTO readings (user_id, reading_date, slot, value)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [req.user.id, date, slot, value]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/readings/:id
router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);

  // Check the reading exists and belongs to this user before validating
  const existing = await db.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [
    id,
    req.user.id,
  ]);
  if (existing.rows.length === 0) throw new HttpError(404, 'Reading not found.');

  const { date, slot, value } = await validateReading(req.body, req.user.id, id);

  // "AND user_id = $5" makes sure users can only edit their own readings
  const result = await db.query(
    `UPDATE readings
     SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
     WHERE id = $4 AND user_id = $5
     RETURNING ${COLUMNS}`,
    [date, slot, value, id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Reading not found.');
  res.json(result.rows[0]);
});

// DELETE /api/readings/:id
router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const result = await db.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [
    id,
    req.user.id,
  ]);
  if (result.rowCount === 0) throw new HttpError(404, 'Reading not found.');
  res.status(204).end();
});

module.exports = router;
