import './ExceptionRow.css';

export default function ExceptionRow({ exception, onClick }) {
  return (
    <div className="exception-row" onClick={() => onClick(exception.id)}>
      <div className="exception-row-main">
        <span className="exception-product">{exception.product_code}</span>
        <span className="exception-plant">{exception.plant}</span>
        <span className={`badge badge-${exception.severity}`}>{exception.severity}</span>
        <span className={`badge badge-${exception.status}`}>{exception.status}</span>
      </div>
      <div className="exception-numbers">
        Planned {exception.planned_units} → Actual {exception.actual_units}
        {' '}<span className="exception-deficit">-{exception.deficit_pct}%</span>
      </div>
    </div>
  );
}
