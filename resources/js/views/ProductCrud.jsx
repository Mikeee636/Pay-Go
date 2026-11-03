import { useState, useEffect, useRef } from 'react';
import { request } from '../api';
import BarcodeSvg from '../components/BarcodeSvg';

function ProductCrud() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const downloadBarcodePng = (product) => {
    if (!product) return;
    const imgElement = document.querySelector('#singleBarcodeModalSvg img');
    if (!imgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 450;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR Code
      ctx.drawImage(img, 50, 40, 300, 300);

      // Draw Code text label below
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(product.code), 200, 375);

      // Draw Product Name
      ctx.fillStyle = '#003333';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(String(product.name), 200, 410);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${product.code || 'product'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = imgElement.src;
  };

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
    const codeVal = form.code.trim();
    const nameVal = form.name.trim();

    if (!codeVal || !nameVal || form.price === '' || form.stock === '') {
      setError('Kode Produk, Nama Produk, Harga, dan Stok Awal wajib diisi.');
      return;
    }

    const catObj = categories.find(c => String(c.id) === String(form.category_id));
    const categoryName = catObj ? catObj.name : (categories[0] ? categories[0].name : 'Umum');

    setSaving(true);
    setError('');
    try {
      const payload = {
        code: codeVal,
        name: nameVal,
        category: categoryName,
        category_id: form.category_id ? Number(form.category_id) : (categories[0] ? categories[0].id : 1),
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description || ''
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

  const getCategoryName = (p) => {
    if (!p) return '-';
    if (typeof p === 'object') {
      if (p.category && p.category !== '-') return p.category;
      if (p.category_name) return p.category_name;
      if (p.category_id) {
        const cat = categories.find(c => String(c.id) === String(p.category_id));
        if (cat) return cat.name;
      }
      return '-';
    }
    const cat = categories.find(c => String(c.id) === String(p));
    return cat ? cat.name : '-';
  };

  return (
    <main className="dashboard-content" style={{ padding: '0.1rem 1rem 0.3rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0', marginBottom: '0.05rem' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {/* Pill-shaped Search Bar in Header */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
            <input
              type="text"
              placeholder="Search product name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        <div className="topbar-right" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={openAddModal}
            style={{ background: 'var(--primary-color)', color: '#ffffff', fontWeight: 800, padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </button>
        </div>
      </header>

      <div className="content-scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: 0 }}>
        {/* Single Unified Container Card for Data Table */}
        <div className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div className="table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="empty-state-cell">Loading data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state-cell">No products found.</td></tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td><code className="code-badge" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{p.code}</code></td>
                      <td><span className="product-name font-bold text-[#003333]">{p.name}</span></td>
                      <td>{getCategoryName(p)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(p.price)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.stock}</td>
                      <td style={{ textAlign: 'center' }}>{getStockBadge(p.stock)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setSelectedBarcodeProduct(p)}
                            title="Lihat &amp; Download Barcode"
                            style={{ background: '#003333', color: '#99CC33', border: 'none', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                              <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14"></path>
                            </svg>
                          </button>
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
            <span>Showing {filtered.length} of {products.length} products</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container scale-up">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="form-grid two-col">
                <div className="input-group">
                  <label>Product Code *</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. PRD-001" disabled={!!editProduct} className="form-input" />
                </div>
                <div className="input-group">
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Fuji Apple" className="form-input" />
                </div>
                <div className="input-group">
                  <label>Category *</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="form-select">
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Price (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 15000" min="0" className="form-input" />
                </div>
                <div className="input-group">
                  <label>Initial Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 50" min="0" className="form-input" />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description (Optional)</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Short product description..." className="form-input" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
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
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Catalog Printable Modal */}
      {showBarcodeModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 99999 }}>
          <div className="modal-container modal-lg scale-up" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#003333' }}>Katalog Barcode Scannable Produk</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Cetak barcode label ini untuk ditempel pada produk atau discan menggunakan scanner kasir</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowBarcodeModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '1.5rem 1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {products.map((p) => (
                  <div key={p.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', background: '#ffffff', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#003333', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '32px' }}>
                      {p.name}
                    </span>
                    <BarcodeSvg code={p.code} name={p.name} height={140} showLabel={true} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{formatRupiah(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowBarcodeModal(false)}>Tutup</button>
              <button type="button" className="btn-primary" onClick={() => window.print()} style={{ background: '#003333', color: '#ffffff' }}>Cetak Barcode Sheet</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Product Barcode Popup Modal with PNG/SVG Download */}
      {selectedBarcodeProduct && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 99999 }}>
          <div className="modal-container modal-sm scale-up" style={{ maxWidth: '460px', width: '90%', textAlign: 'center' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#003333' }}>Detail Barcode Produk</h2>
              <button className="modal-close-btn" onClick={() => setSelectedBarcodeProduct(null)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#003333', margin: 0 }}>{selectedBarcodeProduct.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                   Category: {getCategoryName(selectedBarcodeProduct)} | Price: {formatRupiah(selectedBarcodeProduct.price)}
                </span>

                <div id="singleBarcodeModalSvg" style={{ marginTop: '0.5rem', padding: '8px', background: '#ffffff', borderRadius: '12px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <BarcodeSvg code={selectedBarcodeProduct.code} name={selectedBarcodeProduct.name} height={200} showLabel={true} />
                </div>
              </div>

              <div style={{ width: '100%' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => downloadBarcodePng(selectedBarcodeProduct)}
                  style={{ width: '100%', background: '#99CC33', color: '#003333', fontWeight: 800, fontSize: '0.875rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download Barcode PNG
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedBarcodeProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProductCrud;
