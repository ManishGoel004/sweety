import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import Pagination from '../components/Pagination';
import { SLOTS } from '../constants';
import { formatDate } from '../utils';

const PAGE_SIZE = 20;

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null); // the reading being edited

  async function loadReadings(pageToLoad = page) {
    try {
      const { data } = await api.get('/readings', { params: { page: pageToLoad, limit: PAGE_SIZE } });
      // e.g. we deleted the last reading on the last page -> go back one page
      if (data.data.length === 0 && pageToLoad > 1) {
        setPage(pageToLoad - 1);
        return;
      }
      setReadings(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Load again whenever the page changes
  useEffect(() => {
    loadReadings(page);
  }, [page]);

  async function handleAdd(reading) {
    await api.post('/readings', reading); // errors are shown by the form
    setMessage('Reading added.');
    // New readings are usually recent, so show page 1
    if (page === 1) loadReadings(1);
    else setPage(1);
  }

  async function handleUpdate(reading) {
    await api.put(`/readings/${editing.id}`, reading);
    setEditing(null);
    setMessage('Reading updated.');
    loadReadings();
  }

  async function handleDelete(reading) {
    const ok = window.confirm(
      `Delete the ${SLOTS[reading.slot]} reading (${reading.value} mg/dl) on ${formatDate(reading.date)}?`
    );
    if (!ok) return;
    try {
      await api.delete(`/readings/${reading.id}`);
      setMessage('Reading deleted.');
      if (editing?.id === reading.id) setEditing(null);
      loadReadings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function startEdit(reading) {
    setMessage('');
    setEditing(reading);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      {editing ? (
        // key makes React create a fresh form for each reading we edit
        <ReadingForm key={editing.id} reading={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
      ) : (
        <ReadingForm onSubmit={handleAdd} />
      )}

      <section className="card">
        <h2>
          My readings {total > 0 && <span className="muted">({total})</span>}
        </h2>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <>
            <ReadingList readings={readings} onEdit={startEdit} onDelete={handleDelete} />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </>
  );
}
