import { useState } from 'react';
import ExceptionRow from './ExceptionRow';

export default function DayGroup({ date, exceptions, onRowClick }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f5f5f5',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{open ? '▼' : '▶'} {date}</span>
        <span>{exceptions.length} exception{exceptions.length !== 1 ? 's' : ''}</span>
      </div>
      {open && exceptions.map((exc) => (
        <ExceptionRow key={exc.id} exception={exc} onClick={onRowClick} />
      ))}
    </div>
  );
}
