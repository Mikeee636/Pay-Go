import { useState, useEffect } from 'react';
import { request } from '../api';

function StockManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [adjustModal, setAdjustModal] = useState(null); // product object
  const [adjForm, setAdjForm] = useState({ type: 'add', qty: '', reason: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await request('/products');
      setProducts(data);
    } catch (err) {
      console.error('Gagal memuat stok:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const getStatus = (stock) => {
    if (stock === 0) return 'habis';
    if (stock <= 10) return 'menipis';
    return 'aman';
  };

  const getStatusBadge = (stock) => {
    const status = getStatus(stock);
    if (status === 'habis') return <span className="badge badge-red">Stok Habis</span>;
    if (status === 'menipis') return <span className="badge badge-amber">Stok Menipis</span>;
    return <span className="badge badge-green">Stok Aman</span>;
  };

  const getStockBarColor = (stock) => {
    if (stock === 0) return '#ef4444';
    if (stock <= 10) return '#f59e0b';
    return 'var(--primary-color)';
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    const statusVal = getStatus(p.stock);
    const matchStatus = !filterStatus || statusVal === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdjustModal = (product) => {
    setAdjustModal(product);
    setAdjForm({ type: 'add', qty: '', reason: '' });
    setError('');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(adjForm.qty, 10);
    if (!qty || qty <= 0) {
      setError('Jumlah penyesuaian harus lebih dari 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await request('/stock/adjust', {
        method: 'POST',
        body: {
          product_id: adjustModal.id,
          type: adjForm.type,
          quantity: qty,
          reason: adjForm.reason,
        }
      });
      await fetchProducts();
      setAdjustModal(null);
    } catch (err) {
      setError(err.message || 'Gagal menyesuaikan stok.');
    } finally {
      setSaving(false);
    }
  };

  const stockStats = {
    total: products.length,
    aman: products.filter(p => p.stock > 10).length,
    menipis: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    habis: products.filter(p => p.stock === 0).length,
  };

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Kelola Stok</h1>
          <p className="subtitle">Pantau dan sesuaikan stok produk secara real-time</p>
        </div>
      </header>

      <div className="content-scroll-area">
        {/* Stock stat cards */}
        <div className="stats-grid four-col">
          <div className="stat-card stat-blue">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Produk</span>
              <span className="stat-value">{stockStats.total}</span>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Stok Aman</span>
              <span className="stat-value">{stockStats.aman}</span>
            </div>
          </div>
          <div className="stat-card stat-amber">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Stok Menipis</span>
              <span className="stat-value">{stockStats.menipis}</span>
            </div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Stok Habis</span>
              <span className="stat-value">{stockStats.habis}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Cari nama atau kode produk..."
              value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
          </div>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="aman">Stok Aman</option>
            <option value="menipis">Stok Menipis</option>
            <option value="habis">Stok Habis</option>
          </select>
        </div>

        <div className="admin-card">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Kode</th>
                  <th>Nama Produk</th>
                  <th style={{ width: 200 }}>Level Stok</th>
                  <th style={{ textAlign: 'center' }}>Jumlah</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state-cell">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state-cell">Tidak ada produk ditemukan.</td></tr>
                ) : (
                  filtered.map((p, i) => {
                    const maxStock = 100;
                    const pct = Math.min(100, Math.round((p.stock / maxStock) * 100));
                    return (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td><code className="code-badge">{p.code}</code></td>
                        <td><span className="product-name">{p.name}</span></td>
                        <td>
                          <div className="stock-bar-wrap">
                            <div className="stock-bar-track">
                              <div className="stock-bar-fill"
                                style={{ width: `${pct}%`, background: getStockBarColor(p.stock) }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>{p.stock}</td>
                        <td style={{ textAlign: 'center' }}>{getStatusBadge(p.stock)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-adjust" onClick={() => openAdjustModal(p)}>
                              Sesuaikan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Menampilkan {filtered.length} dari {products.length} produk</span>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjustModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>Sesuaikan Stok</h2>
              <button className="modal-close-btn" onClick={() => setAdjustModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
              <div className="adjust-product-info">
                <span className="adjust-product-name">{adjustModal.name}</span>
                <span className="adjust-product-stock">Stok Saat Ini: <strong>{adjustModal.stock}</strong></span>
              </div>
            </div>
            <form onSubmit={handleAdjustSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Jenis Penyesuaian</label>
                <div className="adjust-type-grid">
                  <label className={`adjust-type-btn ${adjForm.type === 'add' ? 'active-add' : ''}`}>
                    <input type="radio" name="adjType" value="add"
                      checked={adjForm.type === 'add'} onChange={() => setAdjForm({ ...adjForm, type: 'add' })} />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Tambah Stok
                  </label>
                  <label className={`adjust-type-btn ${adjForm.type === 'reduce' ? 'active-reduce' : ''}`}>
                    <input type="radio" name="adjType" value="reduce"
                      checked={adjForm.type === 'reduce'} onChange={() => setAdjForm({ ...adjForm, type: 'reduce' })} />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Kurangi Stok
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label>Jumlah *</label>
                <input type="number" min="1" value={adjForm.qty}
                  onChange={e => setAdjForm({ ...adjForm, qty: e.target.value })}
                  placeholder="Masukkan jumlah..." className="form-input" />
              </div>
              <div className="input-group">
                <label>Keterangan (Opsional)</label>
                <input type="text" value={adjForm.reason}
                  onChange={e => setAdjForm({ ...adjForm, reason: e.target.value })}
                  placeholder="e.g. Restock dari supplier..." className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setAdjustModal(null)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default StockManagement;
