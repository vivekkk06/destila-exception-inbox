import './FilterBar.css';

export default function FilterBar({ productCode, severity, productOptions, onProductChange, onSeverityChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="product-filter">Product</label>
        <select id="product-filter" value={productCode} onChange={(e) => onProductChange(e.target.value)}>
          <option value="">All</option>
          {productOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label htmlFor="severity-filter">Severity</label>
        <select id="severity-filter" value={severity} onChange={(e) => onSeverityChange(e.target.value)}>
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
      </div>
    </div>
  );
}
