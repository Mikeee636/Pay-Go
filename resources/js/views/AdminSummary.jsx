import { useState, useEffect } from 'react';
import { request } from '../api';

function AdminSummary() {
  const [stats, setStats] = useState({
    revenue: 0,
    tax: 0,
    total: 0,
    trxCount: 0,
    unitsCount: 0,
    avgCart: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentTrx, setRecentTrx] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [analytics, transactions] = await Promise.all([
          request('/sales/analytics?period=ALL'),
          request('/transactions'),
        ]);
        setStats(analytics.summary);
        setTopProducts(analytics.topProducts || []);
        setRecentTrx((transactions || []).slice(0, 5));
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatRupiah(stats.revenue),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      color: 'stat-green',
    },
    {
      label: 'Total Transactions',
      value: stats.trxCount + ' Transactions',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      color: 'stat-blue',
    },
    {
      label: 'Units Sold',
      value: stats.unitsCount + ' Units',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      ),
      color: 'stat-amber',
    },
    {
      label: 'Avg. Transaction',
      value: formatRupiah(stats.avgCart),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>
        </svg>
      ),
      color: 'stat-purple',
    },
  ];

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Dashboard Summary</h1>
          <p className="subtitle">Monitor sales performance and store activity at a glance</p>
        </div>
      </header>

      <div className="content-scroll-area">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="stats-grid four-col">
              {statCards.map((card) => (
                <div key={card.label} className={`stat-card ${card.color}`}>
                  <div className="stat-icon-wrap">{card.icon}</div>
                  <div className="stat-info">
                    <span className="stat-label">{card.label}</span>
                    <span className="stat-value">{card.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-grid-two">
              {/* Recent Transactions */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2>Recent Transactions</h2>
                </div>
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Cashier</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrx.length === 0 ? (
                        <tr><td colSpan="4" className="empty-state-cell">No transactions yet.</td></tr>
                      ) : (
                        recentTrx.map(trx => (
                          <tr key={trx.id}>
                            <td><span className="trx-id-badge">{trx.id}</span></td>
                            <td>{trx.date}</td>
                            <td>{trx.cashier}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(trx.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2>Top Selling Products</h2>
                </div>
                <div className="top-products-list">
                  {topProducts.length === 0 ? (
                    <p className="empty-state-cell">No sales data yet.</p>
                  ) : (
                    topProducts.map((p, i) => {
                      const maxQty = topProducts[0]?.qty || 1;
                      const pct = Math.round((p.qty / maxQty) * 100);
                      return (
                        <div key={p.name} className="top-product-row">
                          <div className="top-product-rank">#{i + 1}</div>
                          <div className="top-product-info">
                            <div className="top-product-name-row">
                              <span className="top-product-name">{p.name}</span>
                              <span className="top-product-qty">{p.qty} units</span>
                            </div>
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default AdminSummary;
