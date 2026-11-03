import { useState, useEffect } from 'react';
import { request } from '../api';

function CategoryCrud() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await request('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAddModal = () => {
    setEditCategory(null);
    setForm({ name: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditCategory(c);
    setForm({ name: c.name, description: c.description || '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditCategory(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editCategory) {
        await request(`/categories/${editCategory.id}`, { method: 'PUT', body: form });
      } else {
        await request('/categories', { method: 'POST', body: form });
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await request(`/categories/${deleteId}`, { method: 'DELETE' });
      await fetchAll();
      setDeleteId(null);
    } catch (err) {
      alert(err.message || 'Gagal menghapus kategori. Mungkin masih memiliki produk terkait.');
    }
  };

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Kelola Kategori</h1>
          <p className="subtitle">Organisir produk berdasarkan kategori untuk memudahkan pencarian</p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Kategori
          </button>
        </div>
      </header>

      <div className="content-scroll-area">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Cari nama kategori..."
              value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
          </div>
        </div>

        <div className="admin-card">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th style={{ textAlign: 'center' }}>Jumlah Produk</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="empty-state-cell">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state-cell">Tidak ada kategori ditemukan.</td></tr>
                ) : (
                  filtered.map((cat, i) => (
                    <tr key={cat.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="category-color-dot" style={{ background: `hsl(${(cat.id * 47) % 360}, 65%, 55%)` }}></div>
                          <span style={{ fontWeight: 600 }}>{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-medium)', fontSize: '0.875rem' }}>{cat.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-green">{cat.products_count ?? (cat.products?.length ?? 0)} Produk</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(cat)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => setDeleteId(cat.id)} title="Hapus">
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
            <span>Menampilkan {filtered.length} dari {categories.length} kategori</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>{editCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Nama Kategori *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Buah-buahan Segar" className="form-input" />
              </div>
              <div className="input-group">
                <label>Deskripsi (Opsional)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat kategori..." className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : editCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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
              <p>Hapus kategori ini beserta semua produk di dalamnya? Tindakan ini tidak dapat dibatalkan.</p>
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

export default CategoryCrud;
