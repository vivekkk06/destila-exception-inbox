import { useEffect, useState, useMemo } from 'react';
import { getExceptions, getExceptionDetail, patchException } from './api';
import FilterBar from './components/FilterBar';
import Timeline from './components/Timeline';
import DetailPanel from './components/DetailPanel';

export default function App() {
  const [exceptions, setExceptions] = useState([]);
  const [productCode, setProductCode] = useState('');
  const [severity, setSeverity] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (productCode) params.product_code = productCode;
      if (severity) params.severity = severity;
      const res = await getExceptions(params);
      setExceptions(res.data);
    } catch (e) {
      setError('Failed to load exceptions. Is the backend running on :8000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [productCode, severity]);

  const productOptions = useMemo(() => {
    const set = new Set(exceptions.map((e) => e.product_code));
    return Array.from(set).sort();
  }, [exceptions]);

  const openDetail = async (id) => {
    try {
      const res = await getExceptionDetail(id);
      setDetail(res.data);
    } catch (e) {
      setError('Failed to load exception detail.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await patchException(id, newStatus);
      setExceptions((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      setDetail((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ padding: '1rem' }}>Mini Exception Inbox</h1>
      <FilterBar
        productCode={productCode}
        severity={severity}
        productOptions={productOptions}
        onProductChange={setProductCode}
        onSeverityChange={setSeverity}
      />
      {error && <div style={{ color: 'red', padding: '1rem' }}>{error}</div>}
      {loading ? (
        <div style={{ padding: '2rem' }}>Loading...</div>
      ) : (
        <Timeline exceptions={exceptions} onRowClick={openDetail} />
      )}
      <DetailPanel detail={detail} onClose={() => setDetail(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}
