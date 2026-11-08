const { app, db, request, resetDb, createUser } = require('./helpers');

const DAY = '2026-01-15'; // a fixed date in the past
let token;

const addReading = (body, t = token) =>
  request(app).post('/api/readings').set('Authorization', `Bearer ${t}`).send(body);

beforeEach(async () => {
  await resetDb();
  token = await createUser();
});
afterAll(() => db.pool.end());

describe('readings CRUD', () => {
  test('requires login', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.status).toBe(401);
  });

  test('adds, lists, edits and deletes a reading', async () => {
    const created = await addReading({ date: DAY, slot: 'after_lunch', value: 145 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ date: DAY, slot: 'after_lunch', value: 145 });

    const list = await request(app).get('/api/readings').set('Authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(1);

    const edited = await request(app)
      .put(`/api/readings/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: DAY, slot: 'after_lunch', value: 160 });
    expect(edited.status).toBe(200);
    expect(edited.body.value).toBe(160);

    const deleted = await request(app)
      .delete(`/api/readings/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });
});

describe('pagination', () => {
  const list = (query = '') =>
    request(app).get(`/api/readings${query}`).set('Authorization', `Bearer ${token}`);

  beforeEach(async () => {
    // 5 days x 1 reading = 5 readings, 2026-01-01 .. 2026-01-05
    for (let day = 1; day <= 5; day++) {
      await addReading({ date: `2026-01-0${day}`, slot: 'morning_fasting', value: 100 + day });
    }
  });

  test('defaults to page 1 with 20 per page', async () => {
    const res = await list();
    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 5, totalPages: 1 });
    expect(res.body.data).toHaveLength(5);
  });

  test('returns the requested page, newest first', async () => {
    const page1 = await list('?page=1&limit=2');
    const page3 = await list('?page=3&limit=2');

    expect(page1.body.data.map((r) => r.date)).toEqual(['2026-01-05', '2026-01-04']);
    expect(page3.body.data.map((r) => r.date)).toEqual(['2026-01-01']);
    expect(page3.body).toMatchObject({ page: 3, limit: 2, total: 5, totalPages: 3 });
  });

  test('a page after the last one is empty', async () => {
    const res = await list('?page=9&limit=2');
    expect(res.body.data).toEqual([]);
  });

  test('caps limit at 100', async () => {
    const res = await list('?limit=1000');
    expect(res.body.limit).toBe(100);
  });

  test.each(['?page=0', '?page=abc', '?limit=-5', '?page=1.5'])('rejects %s', async (query) => {
    const res = await list(query);
    expect(res.status).toBe(400);
  });
});

describe('users only see their own readings', () => {
  test('another user cannot list, edit or delete my reading', async () => {
    const mine = await addReading({ date: DAY, slot: 'morning_fasting', value: 100 });
    const otherToken = await createUser('other@example.com', 'Other');
    const auth = `Bearer ${otherToken}`;

    const list = await request(app).get('/api/readings').set('Authorization', auth);
    expect(list.body.data).toHaveLength(0);

    const edit = await request(app)
      .put(`/api/readings/${mine.body.id}`)
      .set('Authorization', auth)
      .send({ date: DAY, slot: 'morning_fasting', value: 300 });
    expect(edit.status).toBe(404);

    const del = await request(app).delete(`/api/readings/${mine.body.id}`).set('Authorization', auth);
    expect(del.status).toBe(404);

    // my reading is unchanged
    const { rows } = await db.query('SELECT value FROM readings WHERE id = $1', [mine.body.id]);
    expect(rows[0].value).toBe(100);
  });
});

describe('validation rules from the assignment', () => {
  test.each([
    [{ date: DAY, slot: 'after_lunch' }, 'Please enter a glucose value.'],
    [{ date: DAY, slot: 'after_lunch', value: 39 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: DAY, slot: 'after_lunch', value: 601 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: DAY, slot: 'after_lunch', value: 120.5 }, 'Value must be between 40 and 600 mg/dl.'],
    [{ date: '2999-01-01', slot: 'after_lunch', value: 120 }, 'Date cannot be in the future.'],
  ])('rejects %j', async (body, message) => {
    const res = await addReading(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  test('only one reading per slot per day', async () => {
    await addReading({ date: DAY, slot: 'after_lunch', value: 140 });
    const res = await addReading({ date: DAY, slot: 'after_lunch', value: 150 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('maximum 4 readings per day', async () => {
    for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      const ok = await addReading({ date: DAY, slot, value: 120 });
      expect(ok.status).toBe(201);
    }
    const res = await addReading({ date: DAY, slot: 'after_dinner', value: 130 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });

  test('editing a reading does not count against itself', async () => {
    const created = await addReading({ date: DAY, slot: 'after_lunch', value: 140 });
    const res = await request(app)
      .put(`/api/readings/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: DAY, slot: 'after_lunch', value: 141 });

    expect(res.status).toBe(200);
  });
});
