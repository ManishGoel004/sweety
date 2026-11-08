import { SLOTS } from '../constants';
import { formatDate } from '../utils';
import StatusBadge from './StatusBadge';

export default function ReadingList({ readings, onEdit, onDelete }) {
  if (readings.length === 0) {
    return <p className="empty">No readings yet. Add your first reading above! 🩸</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time slot</th>
            <th>Value (mg/dl)</th>
            <th>Status</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.date)}</td>
              <td>{SLOTS[r.slot]}</td>
              <td>{r.value}</td>
              <td>
                <StatusBadge value={r.value} />
              </td>
              <td className="actions">
                <button className="btn-link" onClick={() => onEdit(r)}>
                  Edit
                </button>
                <button className="btn-link" onClick={() => onDelete(r)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
