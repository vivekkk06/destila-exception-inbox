export default function FilterBar({ productCode, severity, productOptions, onProductChange, onSeverityChange }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd' }}>
      <div>
        <label style={{ marginRight: '0.5rem' }}>Product:</label>
        <select value={productCode} onChange={(e) => onProductChange(e.target.value)}>
          <option value="">All</option>
          {productOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ marginRight: '0.5rem' }}>Severity:</label>
        <select value={severity} onChange={(e) => onSeverityChange(e.target.value)}>
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
      </div>
    </div>
  );
}
