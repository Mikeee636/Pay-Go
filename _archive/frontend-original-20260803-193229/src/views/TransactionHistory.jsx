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

  const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

  const fetchTransactions = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleResetFilter = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setTimeout(fetchTransactions, 50);
  };

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Riwayat Transaksi</h1>
          <p className="subtitle">Pantau seluruh transaksi penjualan yang telah dilakukan</p>
        </div>
      </header>

      <div className="content-scroll-area">
        {/* Quick Stats */}
        <div className="stats-grid three-col">
          <div className="stat-card stat-blue">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Transaksi</span>
              <span className="stat-value">{stats.count}</span>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Pendapatan</span>
              <span className="stat-value">{formatRupiah(stats.revenue)}</span>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Rata-rata Transaksi</span>
              <span className="stat-value">{formatRupiah(stats.avgCart)}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleFilter} className="filter-bar filter-bar-extended">
          <div className="search-input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Cari no invoice atau nama kasir..."
              value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
          </div>
          <div className="date-filter-group">
            <label>Dari</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="filter-date-input" />
          </div>
          <div className="date-filter-group">
            <label>Hingga</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="filter-date-input" />
          </div>
          <button type="submit" className="btn-primary btn-sm">Filter</button>
          <button type="button" className="btn-secondary btn-sm" onClick={handleResetFilter}>Reset</button>
        </form>

        <div className="admin-card">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>No Invoice</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Kasir</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center', width: 80 }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state-cell">Memuat data...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state-cell">Tidak ada transaksi ditemukan.</td></tr>
                ) : (
                  transactions.map((trx, i) => (
                    <tr key={trx.id}>
                      <td>{i + 1}</td>
                      <td><span className="trx-id-badge">{trx.id}</span></td>
                      <td>{trx.date}</td>
                      <td>{trx.time}</td>
                      <td>{trx.cashier}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {formatRupiah(trx.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-icon btn-edit" onClick={() => setDetailTrx(trx)} title="Lihat Detail">
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
            <span>Menampilkan {transactions.length} transaksi</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailTrx && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container scale-up">
            <div className="modal-header">
              <h2>Detail Transaksi</h2>
              <button className="modal-close-btn" onClick={() => setDetailTrx(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="trx-detail-meta">
                <div className="trx-detail-row">
                  <span>No Invoice</span><span className="trx-id-badge">{detailTrx.id}</span>
                </div>
                <div className="trx-detail-row">
                  <span>Tanggal & Waktu</span><span>{detailTrx.date} {detailTrx.time}</span>
                </div>
                <div className="trx-detail-row">
                  <span>Kasir</span><span>{detailTrx.cashier}</span>
                </div>
              </div>
              <div className="trx-detail-divider"></div>
              <table className="admin-table" style={{ marginBottom: '1rem' }}>
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Harga Satuan</th>
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
                <div className="trx-detail-row"><span>PPN (11%)</span><span>{formatRupiah(detailTrx.tax)}</span></div>
                <div className="trx-detail-row grand"><span>Total</span><span>{formatRupiah(detailTrx.total)}</span></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDetailTrx(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default TransactionHistory;
