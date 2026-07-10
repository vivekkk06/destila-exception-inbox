const badgeStyle = (severity) => ({
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  color: 'white',
  backgroundColor: severity === 'high' ? '#d9534f' : '#f0ad4e',
});

const statusStyle = (status) => ({
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  marginLeft: '0.5rem',
  backgroundColor: status === 'open' ? '#eee' : status === 'acknowledged' ? '#cce5ff' : '#d4edda',
});

export default function ExceptionRow({ exception, onClick }) {
  return (
    <div
      onClick={() => onClick(exception.id)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
      }}
    >
      <div>
        <strong>{exception.product_code}</strong> — {exception.plant}
        <span style={badgeStyle(exception.severity)}> {exception.severity.toUpperCase()}</span>
        <span style={statusStyle(exception.status)}>{exception.status}</span>
      </div>
      <div>
        Planned {exception.planned_units} → Actual {exception.actual_units}
        {' '}(<strong>-{exception.deficit_pct}%</strong>)
      </div>
    </div>
  );
}
