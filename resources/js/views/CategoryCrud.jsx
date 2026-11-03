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
    <main className="dashboard-content" style={{ padding: '0.1rem 1rem 0.3rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0', marginBottom: '0.05rem' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {/* Pill-shaped Search Bar in Header */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
            <input
              type="text"
              placeholder="Search category name..."
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
        </div>

        <div className="topbar-right" style={{ flexShrink: 0 }}>
          <button className="btn-primary" onClick={openAddModal} style={{ background: 'var(--primary-color)', color: '#ffffff', fontWeight: 800, padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Category
          </button>
        </div>
      </header>

      <div className="content-scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: 0 }}>
        {/* Single Unified Container Card for Data Table */}
        <div className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div className="table-container" style={{ flex: 1 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Product Count</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="empty-state-cell">Loading data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state-cell">No categories found.</td></tr>
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
                        <span className="badge badge-green">{cat.products_count ?? (cat.products?.length ?? 0)} Products</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(cat)} title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => setDeleteId(cat.id)} title="Delete">
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
            <span>Showing {filtered.length} of {categories.length} categories</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>{editCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Category Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Fresh Fruits" className="form-input" />
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of the category..." className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editCategory ? 'Save Changes' : 'Add Category'}
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
              <h2>Confirm Delete</h2>
              <button className="modal-close-btn" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </div>
              <p>Delete this category? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default CategoryCrud;
