import { useState, useEffect } from 'react';
import { request } from '../api';

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [detailTrx, setDetailTrx] = useState(null);
  const [stats, setStats] = useState({ count: 0, revenue: 0, avgCart: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ticking ticker for real-time live clock & relative time recalculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

  const fetchTransactions = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const data = await request(`/transactions?${params.toString()}`);
      setTransactions(data || []);
      // Calculate quick stats
      const total = (data || []).reduce((sum, t) => sum + t.total, 0);
      setStats({
        count: (data || []).length,
        revenue: total,
        avgCart: (data || []).length > 0 ? Math.round(total / data.length) : 0,
      });
    } catch (err) {
      console.error('Gagal memuat transaksi:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(true);
    const pollInterval = setInterval(() => fetchTransactions(false), 3000);
    return () => clearInterval(pollInterval);
  }, [search, startDate, endDate]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchTransactions(true);
  };

  const handleResetFilter = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchTransactions(true), 50);
  };

  return (
    <main className="dashboard-content" style={{ padding: '0.1rem 1rem 0.3rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <header className="topbar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0', marginBottom: '0.05rem' }}>
        {/* Pill-shaped Search Bar in Header */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
          <input
            type="text"
            placeholder="Search invoice no or cashier name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 3.4rem 0.65rem 1.25rem',
              borderRadius: '50px',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              color: 'var(--text-dark)',
              transition: 'all 0.2s ease'
            }}
          />
          {/* Divider line and Search Icon on the RIGHT */}
          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.55rem', pointerEvents: 'none' }}>
            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)' }}></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-medium)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </header>

      <div className="content-scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: 0 }}>
        {/* Single Unified Container Card for Data Table */}
        <div className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div className="table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Invoice No</th>
                  <th>Date & Time (Realtime)</th>
                  <th>Cashier</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center', width: 80 }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="empty-state-cell">Loading data...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state-cell">No transactions found.</td></tr>
                ) : (
                  transactions.map((trx, i) => (
                    <tr key={trx.id}>
                      <td>{i + 1}</td>
                      <td><span className="trx-id-badge">{trx.id}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{trx.date}</span>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>{trx.time}</span>
                        </div>
                      </td>
                      <td>{trx.cashier}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {formatRupiah(trx.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-icon btn-edit" onClick={() => setDetailTrx(trx)} title="View Detail">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {transactions.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailTrx && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container scale-up">
            <div className="modal-header">
              <h2>Transaction Detail</h2>
              <button className="modal-close-btn" onClick={() => setDetailTrx(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="trx-detail-meta">
                <div className="trx-detail-row">
                  <span>Invoice No</span><span className="trx-id-badge">{detailTrx.id}</span>
                </div>
                <div className="trx-detail-row">
                  <span>Date & Time</span><span>{detailTrx.date} {detailTrx.time}</span>
                </div>
                <div className="trx-detail-row">
                  <span>Cashier</span><span>{detailTrx.cashier}</span>
                </div>
              </div>
              <div className="trx-detail-divider"></div>
              <table className="admin-table" style={{ marginBottom: '1rem' }}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailTrx.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right' }}>{formatRupiah(item.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="trx-detail-divider"></div>
              <div className="trx-detail-totals">
                <div className="trx-detail-row"><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                <div className="trx-detail-row"><span>VAT (11%)</span><span>{formatRupiah(detailTrx.tax)}</span></div>
                <div className="trx-detail-row grand"><span>Total</span><span>{formatRupiah(detailTrx.total)}</span></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDetailTrx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default TransactionHistory;
