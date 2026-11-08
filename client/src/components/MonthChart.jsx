import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import api, { getErrorMessage } from '../api';
import { SLOTS } from '../constants';

const SLOT_COLORS = {
  morning_fasting: '#2563eb',
  after_breakfast: '#16a34a',
  after_lunch: '#d97706',
  after_dinner: '#9333ea',
};

/**
 * Turns a list of readings into one row per day of the month, e.g.
 *   { day: 5, morning_fasting: 98, after_lunch: 150 }
 * Days without readings are kept, so the x-axis always shows the whole month.
 */
export function buildChartData(readings, range) {
  const lastDay = Number(range.to.slice(8, 10));
  const rows = Array.from({ length: lastDay }, (_, i) => ({ day: i + 1 }));
  for (const r of readings) {
    const day = Number(r.date.slice(8, 10));
    rows[day - 1][r.slot] = r.value;
  }
  return rows;
}

export default function MonthChart({ date }) {
  const [chart, setChart] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    let ignore = false;
    api
      .get('/reports/chart', { params: { date } })
      .then(({ data }) => {
        if (!ignore) {
          setChart(data);
          setError('');
        }
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [date]);

  const [y, m] = date.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <section className="card">
      <h2>Readings in {monthName}</h2>
      {error && <p className="error" role="alert">{error}</p>}

      {chart && chart.readings.length === 0 && <p className="empty">No readings in {monthName} yet. 📈</p>}

      {chart && chart.readings.length > 0 && (
        <div className="chart">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={buildChartData(chart.readings, chart.range)} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5ea" />
              <XAxis dataKey="day" tickLine={false} />
              <YAxis domain={[40, 'auto']} tickLine={false} unit="" width={40} />
              <Tooltip labelFormatter={(day) => `Day ${day}`} formatter={(value, name) => [`${value} mg/dl`, name]} />
              <Legend />
              {/* Dashed lines show the usual target range (70 - 180 mg/dl) */}
              <ReferenceLine y={70} stroke="#b42318" strokeDasharray="4 4" />
              <ReferenceLine y={180} stroke="#b42318" strokeDasharray="4 4" />
              {Object.entries(SLOTS).map(([key, label]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={SLOT_COLORS[key]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="muted chart-note">Dashed lines: usual target range 70–180 mg/dl.</p>
        </div>
      )}
    </section>
  );
}
