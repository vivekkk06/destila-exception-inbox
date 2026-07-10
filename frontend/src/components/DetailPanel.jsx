import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DetailPanel.css';

export default function DetailPanel({ detail, onClose, onStatusChange }) {
  if (!detail) return null;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="detail-title">{detail.product_code}</h2>

        <div className="detail-badges">
          <span className={`badge badge-${detail.severity}`}>{detail.severity}</span>
          <span className={`badge badge-${detail.status}`}>{detail.status}</span>
        </div>

        <div className="detail-stats">
          <div>
            <div className="detail-stat-label">Plant</div>
            <div className="detail-stat-value">{detail.plant}</div>
          </div>
          <div>
            <div className="detail-stat-label">Date</div>
            <div className="detail-stat-value">{detail.date}</div>
          </div>
          <div>
            <div className="detail-stat-label">Planned</div>
            <div className="detail-stat-value">{detail.planned_units}</div>
          </div>
          <div>
            <div className="detail-stat-label">Actual</div>
            <div className="detail-stat-value">{detail.actual_units}</div>
          </div>
          <div>
            <div className="detail-stat-label">Deficit</div>
            <div className="detail-stat-value">{detail.deficit_pct}%</div>
          </div>
        </div>

        <div className="detail-actions">
          <button
            className="detail-btn detail-btn-primary"
            disabled={detail.status === 'acknowledged'}
            onClick={() => onStatusChange(detail.id, 'acknowledged')}
          >
            Acknowledge
          </button>
          <button
            className="detail-btn"
            disabled={detail.status === 'resolved'}
            onClick={() => onStatusChange(detail.id, 'resolved')}
          >
            Resolve
          </button>
        </div>

        <h3 className="detail-section-title">7-Day Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={detail.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            <Line type="monotone" dataKey="planned_units" stroke="#2563eb" name="Planned" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual_units" stroke="#dc2626" name="Actual" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        <table className="detail-table">
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
    </div>
  );
}
