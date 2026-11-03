import { useState, useEffect, useRef } from 'react';
import { request } from '../api';

function SalesReport() {
  const [period, setPeriod] = useState('LAST_30_DAYS');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef(null);

  const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

  const fetchAnalytics = async (p) => {
    setLoading(true);
    try {
      const data = await request(`/sales/analytics?period=${p}`);
      setAnalytics(data);
    } catch (err) {
      console.error('Gagal memuat analitik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(period); }, [period]);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [['Tanggal', 'Pendapatan (Rp)']];
    (analytics.chartData || []).forEach(d => rows.push([d.date, d.val]));
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${period.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // SVG Line Chart renderer
  const renderChart = () => {
    if (!analytics || !analytics.chartData || analytics.chartData.length === 0) {
      return (
        <div className="chart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, opacity: 0.3, marginBottom: '1rem' }}>
            <path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>
          </svg>
          <p>Belum ada data penjualan untuk periode ini.</p>
        </div>
      );
    }

    const data = analytics.chartData;
    const values = data.map(d => d.val);
    const maxVal = Math.max(...values) || 1;

    const W = 700, H = 260;
    const padLeft = 80, padRight = 30, padTop = 20, padBottom = 50;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;
    const n = data.length;

    const getX = (i) => padLeft + (i / Math.max(n - 1, 1)) * chartW;
    const getY = (val) => padTop + chartH - (val / maxVal) * chartH;

    // Y-axis gridlines (5 levels)
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
      y: padTop + chartH - ratio * chartH,
      label: formatRupiah(Math.round(maxVal * ratio)),
    }));

    // Build SVG path
    const points = data.map((d, i) => `${getX(i)},${getY(d.val)}`);
    const linePath = 'M ' + points.join(' L ');
    const areaPath = `${linePath} L ${getX(n - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

    // Format date labels
    const labelInterval = Math.max(1, Math.floor(n / 6));

    return (
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="sales-chart-svg" role="img" aria-label="Grafik penjualan harian">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.02" />
          </linearGradient>
          <filter id="lineShadow" x="-5%" y="-10%" width="110%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--primary-color)" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Gridlines and Y-axis labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padLeft} y1={g.y} x2={W - padRight} y2={g.y}
              stroke="var(--border-color)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '4 4'} />
            <text x={padLeft - 10} y={g.y + 4} textAnchor="end"
              fontSize="10" fill="var(--text-light)" fontFamily="Inter, sans-serif">
              {i === 0 ? '0' : (maxVal * [0, 0.25, 0.5, 0.75, 1][i] / 1000000).toFixed(1) + 'jt'}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--primary-color)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" />

        {/* Data points and X-axis labels */}
        {data.map((d, i) => (
          <g key={i}>
            {i % labelInterval === 0 && (
              <text x={getX(i)} y={H - 10} textAnchor="middle"
                fontSize="9" fill="var(--text-light)" fontFamily="Inter, sans-serif">
                {d.date.slice(5)} {/* Show MM-DD */}
              </text>
            )}
            <circle cx={getX(i)} cy={getY(d.val)} r="4"
              fill="white" stroke="var(--primary-color)" strokeWidth="2" />
            {/* Tooltip title */}
            <title>{d.date}: {formatRupiah(d.val)}</title>
          </g>
        ))}
      </svg>
    );
  };

  const summary = analytics?.summary;

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Laporan Penjualan</h1>
          <p className="subtitle">Analisis performa penjualan berdasarkan periode yang dipilih</p>
        </div>
        <div className="topbar-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-secondary btn-sm" onClick={handleExportCSV}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Export Excel
          </button>
          <button className="btn-secondary btn-sm" onClick={handleExportPDF}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print PDF
          </button>
        </div>
      </header>

      <div className="content-scroll-area">
        {/* Period Filter */}
        <div className="period-filter-bar">
          <span className="period-label">Filter Periode:</span>
          {[
            { value: 'TODAY', label: 'Hari Ini' },
            { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
            { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
            { value: 'ALL', label: 'Semua Waktu' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`period-btn ${period === opt.value ? 'active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Memuat laporan...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="stats-grid three-col">
                <div className="stat-card stat-green">
                  <div className="stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Pendapatan</span>
                    <span className="stat-value">{formatRupiah(summary.revenue)}</span>
                  </div>
                </div>
                <div className="stat-card stat-blue">
                  <div className="stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Transaksi</span>
                    <span className="stat-value">{summary.trxCount}</span>
                  </div>
                </div>
                <div className="stat-card stat-amber">
                  <div className="stat-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Rata-rata Transaksi</span>
                    <span className="stat-value">{formatRupiah(summary.avgCart)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Chart */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>Tren Penjualan Harian</h2>
                <span className="chart-period-label">{period.replace('_', ' ')}</span>
              </div>
              <div className="chart-container">
                {renderChart()}
              </div>
            </div>

            {/* Top Products Table */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>Produk Terlaris (Top 5)</h2>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>Rank</th>
                      <th>Nama Produk</th>
                      <th style={{ textAlign: 'center' }}>Unit Terjual</th>
                      <th style={{ textAlign: 'right' }}>Nilai Penjualan</th>
                      <th style={{ width: 200 }}>Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!analytics?.topProducts || analytics.topProducts.length === 0 ? (
                      <tr><td colSpan="5" className="empty-state-cell">Belum ada data.</td></tr>
                    ) : (() => {
                      const maxVal = analytics.topProducts[0]?.val || 1;
                      return analytics.topProducts.map((p, i) => {
                        const pct = Math.round((p.val / maxVal) * 100);
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                          <tr key={p.name}>
                            <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>{medals[i] || `#${i + 1}`}</td>
                            <td><span className="product-name">{p.name}</span></td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.qty}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>{formatRupiah(p.val)}</td>
                            <td>
                              <div className="progress-bar-track" style={{ marginTop: 0 }}>
                                <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default SalesReport;
