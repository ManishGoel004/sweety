import { getStatus } from '../constants';

// Coloured label: Low (< 70), Normal (70 - 180), High (> 180)
export default function StatusBadge({ value }) {
  const status = getStatus(value);
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
