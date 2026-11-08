const { app, db, request, resetDb, createUser } = require('./helpers');

let token;

async function add(date, slot, value, t = token) {
  const res = await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${t}`)
    .send({ date, slot, value });
  expect(res.status).toBe(201);
}

const getReport = (type, date, t = token) =>
  request(app).get(`/api/reports?type=${type}&date=${date}`).set('Authorization', `Bearer ${t}`);

beforeEach(async () => {
  await resetDb();
  token = await createUser();

  // September
  await add('2026-09-10', 'morning_fasting', 90);
  await add('2026-09-30', 'after_dinner', 200);
  // October
  await add('2026-10-01', 'morning_fasting', 100);
  await add('2026-10-15', 'morning_fasting', 110);
  await add('2026-10-15', 'after_lunch', 155);
  await add('2026-10-15', 'after_breakfast', 141);
  // after the selected date - must NOT be in month-to-date
  await add('2026-10-20', 'after_lunch', 300);
});
afterAll(() => db.pool.end());

test('daily report: stats + readings listed in slot order', async () => {
  const res = await getReport('daily', '2026-10-15');

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    range: { from: '2026-10-15', to: '2026-10-15' },
    count: 3,
    highest: 155,
    lowest: 110,
    average: 135.3, // (110 + 141 + 155) / 3 = 135.33 -> 135.3
  });
  expect(res.body.readings.map((r) => r.slot)).toEqual([
    'morning_fasting',
    'after_breakfast',
    'after_lunch',
  ]);
});

test('month-to-date report: 1 Oct to the selected date only', async () => {
  const res = await getReport('mtd', '2026-10-15');

  expect(res.body).toMatchObject({ count: 4, highest: 155, lowest: 100, average: 126.5 });
  expect(res.body.readings).toBeUndefined();
});

test('monthly report: the whole previous month', async () => {
  const res = await getReport('monthly', '2026-10-15');

  expect(res.body).toMatchObject({
    range: { from: '2026-09-01', to: '2026-09-30' },
    count: 2,
    highest: 200,
    lowest: 90,
    average: 145,
  });
});

test('empty report returns count 0 and null stats', async () => {
  const res = await getReport('daily', '2026-08-01');

  expect(res.body).toMatchObject({ count: 0, highest: null, lowest: null, average: null });
  expect(res.body.readings).toEqual([]);
});

test('report only includes the logged-in user readings', async () => {
  const otherToken = await createUser('other@example.com', 'Other');
  const res = await getReport('mtd', '2026-10-15', otherToken);

  expect(res.body.count).toBe(0);
});

test('rejects an unknown report type', async () => {
  const res = await getReport('yearly', '2026-10-15');
  expect(res.status).toBe(400);
});
