// Previous / Next buttons with "Page 2 of 6"
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </nav>
  );
}
