// Shows highest, lowest, average and number of readings for a report
export default function StatsCard({ report }) {
  const stats = [
    { label: 'Highest', value: report.highest, unit: 'mg/dl' },
    { label: 'Lowest', value: report.lowest, unit: 'mg/dl' },
    { label: 'Average', value: report.average?.toFixed(1), unit: 'mg/dl' },
    { label: 'Readings', value: report.count, unit: '' },
  ];

  return (
    <div className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">
            {s.value} <span className="stat-unit">{s.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
