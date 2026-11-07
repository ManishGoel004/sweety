// Small helper so routes can do: throw new HttpError(400, 'message')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  // Invalid JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  // Safety net: PostgreSQL constraint errors (normally caught earlier by validation)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'This reading already exists.' });
  }
  if (err.code === '23514' || err.code === '22007' || err.code === '22008' || err.code === '22P02' || err.code === '23502') {
    return res.status(400).json({ error: 'Invalid reading data.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { HttpError, notFound, errorHandler };
