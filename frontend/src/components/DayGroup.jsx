import { useState } from 'react';
import ExceptionRow from './ExceptionRow';
import './DayGroup.css';

export default function DayGroup({ date, exceptions, onRowClick }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="day-group">
      <div className="day-group-header" onClick={() => setOpen(!open)}>
        <span className="day-group-date">
          <span className="day-group-chevron">{open ? '▼' : '▶'}</span>
          {date}
        </span>
        <span className="day-group-count">
          {exceptions.length} exception{exceptions.length !== 1 ? 's' : ''}
        </span>
      </div>
      {open && exceptions.map((exc) => (
        <ExceptionRow key={exc.id} exception={exc} onClick={onRowClick} />
      ))}
    </div>
  );
}
