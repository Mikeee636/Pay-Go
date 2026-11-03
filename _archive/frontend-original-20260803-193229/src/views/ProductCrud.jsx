import { useState, useEffect, useRef } from 'react';
import { request } from '../api';

function ProductCrud() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '', name: '', category_id: '', price: '', stock: '', description: ''
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        request('/products'),
        request('/categories')
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Gagal memuat data produk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAddModal = () => {
    setEditProduct(null);
    setForm({ code: '', name: '', category_id: categories[0]?.id || '', price: '', stock: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setForm({
      code: p.code,
      name: p.name,
      category_id: p.category_id,
      price: String(p.price),
      stock: String(p.stock),
      description: p.description || ''
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditProduct(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.category_id || !form.price || form.stock === '') {
      setError('Semua field wajib harus diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code,
        name: form.name,
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
      };
      if (editProduct) {
        await request(`/products/${editProduct.id}`, { method: 'PUT', body: payload });
      } else {
        await request('/products', { method: 'POST', body: payload });
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request(`/products/${deleteId}`, { method: 'DELETE' });
      await fetchAll();
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Gagal menghapus produk.');
    }
  };

  const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    const matchCat = !filterCategory || String(p.category_id) === filterCategory;
    return matchSearch && matchCat;
  });

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-red">Habis</span>;
    if (stock <= 10) return <span className="badge badge-amber">Menipis</span>;
    return <span className="badge badge-green">Tersedia</span>;
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : '-';
  };

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Kelola Produk</h1>
          <p className="subtitle">Tambah, edit, dan hapus produk dari katalog FreshMarket</p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Produk
          </button>
        </div>
      </header>

      <div className="content-scroll-area">
        {/* Filters */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau kode produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
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
                  <th>Kategori</th>
                  <th style={{ textAlign: 'right' }}>Harga</th>
                  <th style={{ textAlign: 'center' }}>Stok</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="empty-state-cell">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state-cell">Tidak ada produk ditemukan.</td></tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td><code className="code-badge">{p.code}</code></td>
                      <td><span className="product-name">{p.name}</span></td>
                      <td>{getCategoryName(p.category_id)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(p.price)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.stock}</td>
                      <td style={{ textAlign: 'center' }}>{getStockBadge(p.stock)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(p)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => setDeleteId(p.id)} title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Menampilkan {filtered.length} dari {products.length} produk</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container scale-up">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="form-grid two-col">
                <div className="input-group">
                  <label>Kode Produk *</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. PRD-001" disabled={!!editProduct} className="form-input" />
                </div>
                <div className="input-group">
                  <label>Nama Produk *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Apel Fuji" className="form-input" />
                </div>
                <div className="input-group">
                  <label>Kategori *</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="form-select">
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Harga (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 15000" min="0" className="form-input" />
                </div>
                <div className="input-group">
                  <label>Stok Awal *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 50" min="0" className="form-input" />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Deskripsi (Opsional)</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi singkat produk..." className="form-input" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>Konfirmasi Hapus</h2>
              <button className="modal-close-btn" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </div>
              <p>Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button>
              <button className="btn-danger" onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProductCrud;
