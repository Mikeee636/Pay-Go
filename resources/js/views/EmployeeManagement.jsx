import { useState, useEffect } from 'react';
import { request } from '../api';

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [verifyModal, setVerifyModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [verifyForm, setVerifyForm] = useState({ code: '', password: '' });
  const [resetForm, setResetForm] = useState({ password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetRequests, setResetRequests] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('payngo_password_reset_requests') || '[]');
      setResetRequests(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleApproveResetRequest = (req) => {
    const matchedEmp = employees.find(e =>
      e.email.toLowerCase() === req.identifier.toLowerCase() ||
      (e.code && e.code.toLowerCase() === req.identifier.toLowerCase())
    );

    if (matchedEmp) {
      setResetModal(matchedEmp);
    } else {
      setResetModal({ id: 'temp-' + req.id, name: req.identifier, email: req.identifier });
    }
    setResetForm({ password: '', password_confirmation: '' });
    setError('');

    // Mark as resolved
    const updated = resetRequests.map(r => r.id === req.id ? { ...r, status: 'RESOLVED' } : r);
    setResetRequests(updated);
    localStorage.setItem('payngo_password_reset_requests', JSON.stringify(updated));
  };

  const handleDismissResetRequest = (reqId) => {
    const updated = resetRequests.filter(r => r.id !== reqId);
    setResetRequests(updated);
    localStorage.setItem('payngo_password_reset_requests', JSON.stringify(updated));
  };

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
    if (status === 'Aktif') return <span className="badge badge-green">Aktif</span>;
    if (status === 'Belum Diverifikasi') return <span className="badge badge-amber">Menunggu Verifikasi</span>;
    return <span className="badge badge-red">Nonaktif</span>;
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyForm.code.trim() || !verifyForm.password) {
      setError('Nomor Karyawan dan Password wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await request(`/employees/${verifyModal.id}/verify`, {
        method: 'POST',
        body: {
          code: verifyForm.code,
          password: verifyForm.password,
        }
      });
      await fetchEmployees();
      setVerifyModal(null);
      setVerifyForm({ code: '', password: '' });
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
        method: 'PUT',
        body: { password: resetForm.password }
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
    const action = emp.status === 'Aktif' ? 'nonaktifkan' : 'aktifkan';
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
    <main className="dashboard-content" style={{ padding: '0.1rem 1rem 0.3rem 1rem', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <header className="topbar" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0', marginBottom: '0.05rem' }}>
        {/* Pill-shaped Search Bar in Header */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
          <input
            type="text"
            placeholder="Search employee name or number..."
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

      <div className="content-scroll-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, marginTop: 0 }}>
        
        {/* Pending Password Reset Requests from Login page */}
        {resetRequests.filter(r => r.status === 'PENDING').length > 0 && (
          <div style={{ padding: '1.25rem', background: '#ecfdf5', borderRadius: '12px', border: '1.5px solid #a7f3d0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#047857', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Password Reset Requests ({resetRequests.filter(r => r.status === 'PENDING').length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {resetRequests.filter(r => r.status === 'PENDING').map(req => (
                <div key={req.id} style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.875rem' }}>{req.identifier}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-medium)', marginLeft: '0.5rem' }}>({req.requestedAt})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-verify"
                      onClick={() => handleApproveResetRequest(req)}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissResetRequest(req.id)}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Unified Container Card for Data Table */}
        <div className="admin-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem 1.5rem', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div className="table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Employee Name</th>
                  <th>Employee No.</th>
                  <th>Position</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center', width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="empty-state-cell">Loading data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state-cell">No employees found.</td></tr>
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
                          {emp.status === 'Belum Diverifikasi' && (
                            <button className="btn-verify" onClick={() => { setVerifyModal(emp); setVerifyForm({ code: '', password: '' }); setError(''); }}>
                              Verify
                            </button>
                          )}
                          <button className="btn-icon btn-edit" onClick={() => { setResetModal(emp); setResetForm({ password: '', password_confirmation: '' }); setError(''); }} title="Reset Password">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </button>
                          <button
                            className={`btn-icon ${emp.status === 'Aktif' ? 'btn-delete' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {emp.status === 'Aktif' ? (
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
            <span>Showing {filtered.length} of {employees.length} employees</span>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container modal-sm scale-up">
            <div className="modal-header">
              <h2>Verify Employee Account</h2>
              <button className="modal-close-btn" onClick={() => setVerifyModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 1.5rem 1rem' }}>
              <div className="verify-info-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: 'var(--primary-color)', flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Set the employee number and password for <strong>{verifyModal.name}</strong>'s account. The employee will be able to login after verification.</p>
              </div>
            </div>
            <form onSubmit={handleVerifySubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>Employee Number *</label>
                <input type="text" value={verifyForm.code}
                  onChange={e => setVerifyForm({ ...verifyForm, code: e.target.value })}
                  placeholder="e.g. EMP-001" className="form-input" />
              </div>
              <div className="input-group">
                <label>Initial Password *</label>
                <input type="password" value={verifyForm.password}
                  onChange={e => setVerifyForm({ ...verifyForm, password: e.target.value })}
                  placeholder="Min. 6 characters" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setVerifyModal(null)}>Cancel</button>
                <button type="submit" className="btn-verify-submit" disabled={saving}>
                  {saving ? 'Processing...' : 'Verify & Activate'}
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
                Reset password for account <strong>{resetModal.name}</strong>.
              </p>
            </div>
            <form onSubmit={handleResetSubmit} className="modal-form">
              {error && <div className="form-error-banner">{error}</div>}
              <div className="input-group">
                <label>New Password *</label>
                <input type="password" value={resetForm.password}
                  onChange={e => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="Min. 6 characters" className="form-input" />
              </div>
              <div className="input-group">
                <label>Confirm Password *</label>
                <input type="password" value={resetForm.password_confirmation}
                  onChange={e => setResetForm({ ...resetForm, password_confirmation: e.target.value })}
                  placeholder="Repeat new password" className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setResetModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Processing...' : 'Reset Password'}
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
