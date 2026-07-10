import DayGroup from './DayGroup';
import './Timeline.css';

export default function Timeline({ exceptions, onRowClick }) {
  const groups = [];
  const indexByDate = {};

  for (const exc of exceptions) {
    if (!(exc.date in indexByDate)) {
      indexByDate[exc.date] = groups.length;
      groups.push({ date: exc.date, exceptions: [] });
    }
    groups[indexByDate[exc.date]].exceptions.push(exc);
  }

  if (groups.length === 0) {
    return <div className="timeline-empty">No exceptions match the current filters.</div>;
  }

  return (
    <div>
      {groups.map((g) => (
        <DayGroup key={g.date} date={g.date} exceptions={g.exceptions} onRowClick={onRowClick} />
      ))}
    </div>
  );
}
