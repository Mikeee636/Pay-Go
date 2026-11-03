import { useState, useEffect } from 'react';
import { request } from '../api';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [verifyModal, setVerifyModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ employee_code: '', password: '' });
  const [resetForm, setResetForm] = useState({ password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await request('/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Gagal memuat data karyawan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="badge badge-green">Aktif</span>;
    if (status === 'pending') return <span className="badge badge-amber">Menunggu Verifikasi</span>;
    return <span className="badge badge-red">Nonaktif</span>;
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyForm.employee_code.trim() || !verifyForm.password) {
      setError('Nomor Karyawan dan Password wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await request(`/employees/${verifyModal.id}/verify`, {
        method: 'POST',
        body: {
          employee_code: verifyForm.employee_code,
          password: verifyForm.password,
        }
      });
      await fetchEmployees();
      setVerifyModal(null);
      setVerifyForm({ employee_code: '', password: '' });
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi karyawan.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetForm.password || resetForm.password.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (resetForm.password !== resetForm.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await request(`/employees/${resetModal.id}/reset-password`, {
        method: 'POST',
        body: { password: resetForm.password, password_confirmation: resetForm.password_confirmation }
      });
      alert('Password berhasil direset!');
      setResetModal(null);
      setResetForm({ password: '', password_confirmation: '' });
    } catch (err) {
      setError(err.message || 'Gagal mereset password.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const action = emp.status === 'active' ? 'nonaktifkan' : 'aktifkan';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} akun ${emp.name}?`)) return;
    try {
      await request(`/employees/${emp.id}/toggle-status`, { method: 'PUT' });
      await fetchEmployees();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status karyawan.');
    }
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search || e.name.toLowerCase().includes(q) || (e.code && e.code.toLowerCase().includes(q));
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <main className="dashboard-content">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Kelola Karyawan</h1>
          <p className="subtitle">Verifikasi akun karyawan, reset password, dan kelola status akun</p>
        </div>
      </header>

      <div className="content-scroll-area">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Cari nama atau nomor karyawan..."
              value={search} onChange={e => setSearch(e.target.value)} className="filter-input" />
          </div>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="admin-card">
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Karyawan</th>
                  <th>No. Karyawan</th>
                  <th>Jabatan</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 220 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state-cell">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state-cell">Tidak ada karyawan ditemukan.</td></tr>
                ) : (
                  filtered.map((emp, i) => (
                    <tr key={emp.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="employee-name">{emp.name}</span>
                        </div>
                      </td>
                      <td>
                        {emp.code ? <code className="code-badge">{emp.code}</code> : <span style={{ color: 'var(--text-light)' }}>-</span>}
                      </td>
                      <td>{emp.position || '-'}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>{emp.email}</td>
                      <td style={{ textAlign: 'center' }}>{getStatusBadge(emp.status)}</td>
                      <td>
                        <div className="action-buttons justify-center">
                          {emp.status === 'pending' && (
                            <button className="btn-verify" onClick={() => { setVerifyModal(emp); setVerifyForm({ employee_code: '', password: '' }); setError(''); }}>
                              Verifikasi
                            </button>
                          )}
                          <button className="btn-icon btn-edit" onClick={() => { setResetModal(emp); setResetForm({ password: '', password_confirmation: '' }); setError(''); }} title="Reset Password">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </button>
                          <button
                            className={`btn-icon ${emp.status === 'active' ? 'btn-delete' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {emp.status === 'active' ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle><polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
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
            <span>Menampilkan {filtered.length} dari {employees.length} karyawan</span>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>Verifikasi Akun Karyawan</h2>
              <button className="modal-close-btn" onClick={() => setVerifyModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 1.5rem 1rem' }}>
              <div className="verify-info-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: 'var(--primary-color)', flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Tetapkan nomor karyawan dan password untuk akun <strong>{verifyModal.name}</strong>. Karyawan akan dapat login setelah verifikasi.</p>
              </div>
            </div>
            <form onSubmit={handleVerifySubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Nomor Karyawan *</label>
                <input type="text" value={verifyForm.employee_code}
                  onChange={e => setVerifyForm({ ...verifyForm, employee_code: e.target.value })}
                  placeholder="e.g. EMP-001" className="form-input" />
              </div>
              <div className="input-group">
                <label>Password Awal *</label>
                <input type="password" value={verifyForm.password}
                  onChange={e => setVerifyForm({ ...verifyForm, password: e.target.value })}
                  placeholder="Min. 6 karakter" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setVerifyModal(null)}>Batal</button>
                <button type="submit" className="btn-verify-submit" disabled={saving}>
                  {saving ? 'Memproses...' : 'Verifikasi & Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close-btn" onClick={() => setResetModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 1.5rem 1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
                Reset password untuk akun <strong>{resetModal.name}</strong>.
              </p>
            </div>
            <form onSubmit={handleResetSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Password Baru *</label>
                <input type="password" value={resetForm.password}
                  onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="Min. 6 karakter" className="form-input" />
              </div>
              <div className="input-group">
                <label>Konfirmasi Password *</label>
                <input type="password" value={resetForm.password_confirmation}
                  onChange={e => setResetForm({ ...resetForm, password_confirmation: e.target.value })}
                  placeholder="Ulangi password baru" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setResetModal(null)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default EmployeeManagement;
