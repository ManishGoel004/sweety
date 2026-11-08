import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import StatsCard from '../components/StatsCard';
import MonthChart from '../components/MonthChart';
import StatusBadge from '../components/StatusBadge';
import { SLOTS } from '../constants';
import { formatDate, todayString } from '../utils';

const REPORT_TYPES = [
  { key: 'daily', label: 'Daily' },
  { key: 'mtd', label: 'Month-to-date' },
  { key: 'monthly', label: 'Monthly (previous month)' },
];

function rangeText({ from, to }) {
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

export default function Reports() {
  const [type, setType] = useState('daily');
  const [date, setDate] = useState(todayString());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // Load the report whenever the type or date changes
  useEffect(() => {
    if (!date) return;
    let ignore = false; // ignore old responses if the user clicks quickly

    api
      .get('/reports', { params: { type, date } })
      .then(({ data }) => {
        if (!ignore) {
          setReport(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      });

    return () => {
      ignore = true;
    };
  }, [type, date]);

  return (
    <>
      <section className="card">
        <h2>Reports</h2>

        <div className="report-controls">
          <div className="tabs" role="tablist">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={type === t.key}
                className={type === t.key ? 'tab active' : 'tab'}
                onClick={() => setType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="report-date">Selected date</label>
            <input id="report-date" type="date" value={date} max={todayString()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {report && (
          <>
            <p className="muted">Showing {rangeText(report.range)}</p>

            {report.count === 0 ? (
              <div className="empty">
                <p>No readings for this period yet. 📭</p>
                <Link to="/readings">Add a reading</Link>
              </div>
            ) : (
              <>
                <StatsCard report={report} />

                {report.readings && (
                  <>
                    <h3>Readings on {formatDate(report.range.from)}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Time slot</th>
                          <th>Value (mg/dl)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.readings.map((r) => (
                          <tr key={r.id}>
                            <td>{SLOTS[r.slot]}</td>
                            <td>{r.value}</td>
                            <td>
                              <StatusBadge value={r.value} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Line chart for the month of the selected date */}
      {date && <MonthChart date={date} />}
    </>
  );
}
