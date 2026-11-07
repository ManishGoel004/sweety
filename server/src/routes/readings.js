const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

// Every readings route needs a logged-in user
router.use(requireAuth);

// Sort readings by date (newest first), then by slot in the order of the day
const ORDER_BY = `
  ORDER BY reading_date DESC,
  array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner']::varchar[], slot)
`;

const COLUMNS = 'id, reading_date AS date, slot, value, created_at, updated_at';

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Reading not found.');
  return id;
}

// GET /api/readings - only the logged-in user's readings
router.get('/', async (req, res) => {
  const result = await db.query(
    `SELECT ${COLUMNS} FROM readings WHERE user_id = $1 ${ORDER_BY}`,
    [req.user.id]
  );
  res.json({ data: result.rows });
});

// POST /api/readings
router.post('/', async (req, res) => {
  const { date, slot, value } = req.body;

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
  const { date, slot, value } = req.body;

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
