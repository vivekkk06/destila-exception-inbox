import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DetailPanel({ detail, onClose, onStatusChange }) {
  if (!detail) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
      backgroundColor: 'white', boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
      padding: '1.5rem', overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right' }}>✕</button>
      <h2>{detail.product_code}</h2>
      <p>Plant: {detail.plant}</p>
      <p>Date: {detail.date}</p>
      <p>Planned: <strong>{detail.planned_units}</strong></p>
      <p>Actual: <strong>{detail.actual_units}</strong></p>
      <p>Deficit: <strong>{detail.deficit_pct}%</strong> ({detail.severity})</p>
      <p>Status: <strong>{detail.status}</strong></p>

      <div style={{ margin: '1rem 0' }}>
        <button
          disabled={detail.status === 'acknowledged'}
          onClick={() => onStatusChange(detail.id, 'acknowledged')}
          style={{ marginRight: '0.5rem' }}
        >
          Acknowledge
        </button>
        <button
          disabled={detail.status === 'resolved'}
          onClick={() => onStatusChange(detail.id, 'resolved')}
        >
          Resolve
        </button>
      </div>

      <h3>7-Day Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={detail.trend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="planned_units" stroke="#8884d8" name="Planned" />
          <Line type="monotone" dataKey="actual_units" stroke="#d9534f" name="Actual" />
        </LineChart>
      </ResponsiveContainer>

      <table style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>Date</th><th>Planned</th><th>Actual</th></tr>
        </thead>
        <tbody>
          {detail.trend.map((t) => (
            <tr key={t.date}>
              <td>{t.date}</td>
              <td>{t.planned_units}</td>
              <td>{t.actual_units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
