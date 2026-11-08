const { app, db, request, resetDb } = require('./helpers');

const newUser = { name: 'Asha', email: 'Asha@Example.com', password: 'secret123' };

beforeEach(resetDb);
afterAll(() => db.pool.end());

describe('POST /api/auth/register', () => {
  test('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual({ id: 1, name: 'Asha', email: 'asha@example.com' });
  });

  test('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send(newUser);

    const { rows } = await db.query('SELECT password_hash FROM users');
    expect(rows[0].password_hash).not.toBe('secret123');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  test('rejects a duplicate email (case-insensitive)', async () => {
    await request(app).post('/api/auth/register').send(newUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...newUser, email: 'asha@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('An account with this email already exists.');
  });

  test.each([
    [{ ...newUser, name: '' }, 'Please enter your name.'],
    [{ ...newUser, email: 'not-an-email' }, 'Please enter a valid email address.'],
    [{ ...newUser, password: '123' }, 'Password must be at least 6 characters.'],
  ])('validates input %#', async (body, message) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(newUser));

  test('logs in with the correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('gives the same error for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});
