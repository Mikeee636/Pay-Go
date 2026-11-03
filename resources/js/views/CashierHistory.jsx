import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api';

function CashierHistory() {
  const navigate = useNavigate();

  // Active cashier details
  const [cashierName, setCashierName] = useState('Cashier');
  const [cashierCode, setCashierCode] = useState('-');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('payngo_cashier_sidebar_collapsed') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Realtime Ticking Clock (updates state every 1 sec for live time & relative time)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom Dialog Modal State
  const [dialogConfig, setDialogConfig] = useState(null);

  const showCustomAlert = (message, title = 'Notice') => {
    setDialogConfig({
      type: 'alert',
      title,
      message,
      onConfirm: () => setDialogConfig(null)
    });
  };

  const showCustomConfirm = (message, onConfirm, title = 'Confirmation', isDestructive = false) => {
    setDialogConfig({
      type: 'confirm',
      title,
      message,
      isDestructive,
      onConfirm: () => {
        setDialogConfig(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => setDialogConfig(null)
    });
  };

  // Helper function to get clean real-time WIB (Asia/Jakarta) Date & Time
  const getNowDateTime = (offsetMinutes = 0) => {
    const d = new Date(Date.now() - offsetMinutes * 60 * 1000);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d); // YYYY-MM-DD
    const timeStr = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d).replace(/\./g, ':');
    return { date: dateStr, time: timeStr };
  };

  // Initial Sample Data using actual current real-time clock
  const getDefaultHistory = () => [
    {
      id: 'INV-882910',
      date: getNowDateTime(0).date,
      time: getNowDateTime(0).time,
      cashier: 'Budi Santoso',
      method: 'TUNAI',
      total: 38500,
      subtotal: 34685,
      tax: 3815,
      cashPaid: 50000,
      change: 11500,
      items: [
        { name: 'Minyak Goreng 2L', qty: 1, price: 28000, discount: 0 },
        { name: 'Indomie Goreng', qty: 3, price: 3500, discount: 0 }
      ]
    },
    {
      id: 'INV-882911',
      date: getNowDateTime(10).date,
      time: getNowDateTime(10).time,
      cashier: 'Budi Santoso',
      method: 'QRIS',
      total: 16500,
      subtotal: 14865,
      tax: 1635,
      cashPaid: 16500,
      change: 0,
      items: [
        { name: 'Susu UHT 1L', qty: 1, price: 16500, discount: 0 }
      ]
    },
    {
      id: 'INV-882912',
      date: getNowDateTime(25).date,
      time: getNowDateTime(25).time,
      cashier: 'Budi Santoso',
      method: 'DEBIT',
      total: 42000,
      subtotal: 37838,
      tax: 4162,
      cashPaid: 42000,
      change: 0,
      items: [
        { name: 'Beras 5kg Premium', qty: 1, price: 42000, discount: 0 }
      ]
    }
  ];

  // Helper function to fetch transactions from server in real-time
  const fetchHistoryFromApi = useCallback(async () => {
    try {
      const data = await request('/transactions');

      // Get list of deleted transaction IDs from localStorage
      const deletedIds = new Set(JSON.parse(localStorage.getItem('payngo_deleted_trx_ids') || '[]'));
      const isClearedAll = localStorage.getItem('payngo_history_cleared') === 'true';

      if (Array.isArray(data)) {
        let mapped = data
          .filter(item => !deletedIds.has(item.id))
          .map(item => ({
            id: item.id,
            date: item.date,
            time: item.time || getNowDateTime(0).time,
            cashier: item.cashier || 'Kasir',
            method: item.method || 'TUNAI',
            total: item.total || 0,
            subtotal: item.subtotal || 0,
            tax: item.tax || 0,
            cashPaid: item.total || 0,
            change: 0,
            items: item.items || []
          }));

        // Combine API history with local history (merge by ID), filtering out deleted IDs
        const localSaved = JSON.parse(localStorage.getItem('payngo_transaction_history') || '[]');
        const apiIds = new Set(mapped.map(m => m.id));
        const localFiltered = localSaved.filter(l => !apiIds.has(l.id) && !deletedIds.has(l.id));
        
        let merged = [...mapped, ...localFiltered];

        if (isClearedAll && mapped.length === 0) {
          merged = [];
        }

        setHistory(merged);
        localStorage.setItem('payngo_transaction_history', JSON.stringify(merged));
        return;
      }
    } catch (err) {
      console.log('Realtime transactions load fallback:', err);
    }
  }, []);

  // Authorization and Realtime Load History
  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');
    const code = localStorage.getItem('currentUserIdentifier');

    if (!role || (role !== 'Karyawan' && role !== 'Admin')) {
      navigate('/');
      return;
    }

    if (name) setCashierName(name);
    if (code) setCashierCode(code);

    const defaultData = getDefaultHistory();
    const isClearedAll = localStorage.getItem('payngo_history_cleared') === 'true';
    const deletedIds = new Set(JSON.parse(localStorage.getItem('payngo_deleted_trx_ids') || '[]'));

    // Initial load from local storage first for quick UI response
    try {
      const saved = localStorage.getItem('payngo_transaction_history');
      if (saved !== null) {
        let parsed = JSON.parse(saved).filter(item => !deletedIds.has(item.id));
        setHistory(parsed);
      } else if (!isClearedAll) {
        const freshDefault = defaultData.filter(item => !deletedIds.has(item.id));
        setHistory(freshDefault);
        localStorage.setItem('payngo_transaction_history', JSON.stringify(freshDefault));
      } else {
        setHistory([]);
        localStorage.setItem('payngo_transaction_history', JSON.stringify([]));
      }
    } catch {
      setHistory([]);
    }

    // Immediate initial API fetch & start real-time polling every 3 seconds
    fetchHistoryFromApi();
    const pollInterval = setInterval(fetchHistoryFromApi, 3000);
    return () => clearInterval(pollInterval);
  }, [navigate, fetchHistoryFromApi]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('payngo_cashier_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Format currency helper
  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  // Delete Single Transaction with Custom Modal
  const handleDeleteItem = (id) => {
    showCustomConfirm(
      `Are you sure you want to delete transaction history #${id}?`,
      async () => {
        // 1. Remove from local state
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem('payngo_transaction_history', JSON.stringify(updated));

        // 2. Persist deleted ID in localStorage so it never reappears
        const deletedIds = JSON.parse(localStorage.getItem('payngo_deleted_trx_ids') || '[]');
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('payngo_deleted_trx_ids', JSON.stringify(deletedIds));
        }

        // 3. Delete from backend API database
        try {
          await request('/transactions/' + id, { method: 'DELETE' });
        } catch (e) {
          console.log('API delete single transaction failed:', e);
        }
      },
      'Delete Transaction',
      true
    );
  };

  // Delete All Transactions with Custom Modal
  const handleDeleteAll = () => {
    if (history.length === 0) return;
    showCustomConfirm(
      'Are you sure you want to delete ALL transaction history?',
      async () => {
        // 1. Clear local state and set cleared flag
        setHistory([]);
        localStorage.setItem('payngo_transaction_history', JSON.stringify([]));
        localStorage.setItem('payngo_history_cleared', 'true');

        // 2. Store all current IDs as deleted
        const currentIds = history.map(h => h.id);
        const deletedIds = JSON.parse(localStorage.getItem('payngo_deleted_trx_ids') || '[]');
        const combinedDeleted = Array.from(new Set([...deletedIds, ...currentIds]));
        localStorage.setItem('payngo_deleted_trx_ids', JSON.stringify(combinedDeleted));

        // 3. Delete all from backend API database
        try {
          await request('/transactions', { method: 'DELETE' });
        } catch (e) {
          console.log('API clear all transactions failed:', e);
        }
      },
      'Clear All History',
      true
    );
  };

  // Logout Handler with Custom Modal
  const handleLogout = () => {
    showCustomConfirm(
      'Are you sure you want to log out of POS Cashier?',
      () => {
        localStorage.clear();
        navigate('/');
      },
      'Log Out',
      true
    );
  };

  // Filtered transactions by search query
  const filteredHistory = history.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchId = item.id.toLowerCase().includes(q);
    const matchCashier = (item.cashier || '').toLowerCase().includes(q);
    const matchMethod = (item.method || '').toLowerCase().includes(q);
    const matchItem = item.items && item.items.some(i => i.name.toLowerCase().includes(q));
    return matchId || matchCashier || matchMethod || matchItem;
  });

  return (
    <div className="dashboard-body">
      <div className="dashboard-wrapper">

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-medium)',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {!isSidebarCollapsed && (
              <span className="payngo-logo-brand">
                <span className="pay-part">Pay</span>
                <span className="amp-part">&amp;</span>
                <span className="go-part">Go</span>
              </span>
            )}
          </div>

          <div className="sidebar-header-divider"></div>

          <div className="user-profile-card">
            <div className="user-avatar" title={cashierName}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">{cashierName}</span>
              <span className="user-role">Employee ID: {cashierCode}</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <a
              href="#"
              className="menu-item"
              onClick={(e) => { e.preventDefault(); navigate('/cashier'); }}
              title="Transaction Menu"
            >
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
              <span className="menu-text-label">Transaction Menu</span>
            </a>

            <a
              href="#"
              className="menu-item active"
              onClick={(e) => e.preventDefault()}
              title="Transaction History"
            >
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="menu-text-label">Transaction History</span>
            </a>

            <div className="sidebar-footer">
              <a href="#" className="menu-item logout" onClick={(e) => { e.preventDefault(); handleLogout(); }} title="Logout">
                <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="menu-text-label">Logout</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content Workspace */}
        <main className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', width: '100%', overflowY: 'auto' }}>

          {/* Unified Single Card Container */}
          <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', flex: 1, minHeight: '550px', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            
            {/* 1. Header (Pojok Kiri Atas) */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                Transaction History
              </h1>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-medium)' }}>
                List of customer purchase history ({history.length} Transactions)
              </p>
            </div>

            {/* 2. Action Toolbar (Search Bar & Clear All Button) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <input
                  type="text"
                  placeholder="Search Invoice No / Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 3rem 0.55rem 1rem',
                    borderRadius: '50px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.825rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                <div style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.55rem', pointerEvents: 'none' }}>
                  <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)' }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-medium)' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>

              {/* Clear All History Button */}
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={history.length === 0}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  background: history.length === 0 ? '#f1f5f9' : '#ef4444',
                  color: history.length === 0 ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: history.length === 0 ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Clear All History
              </button>
            </div>

            {/* 3. History List Table / Empty State */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
              {filteredHistory.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-medium)', minHeight: '300px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-dark)' }}>
                    No transaction history
                  </h3>
                  <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-medium)' }}>
                    {searchQuery ? 'No transactions found matching your search query.' : 'Customer transaction receipts will appear here.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-medium)', fontWeight: 700 }}>
                        <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Invoice No</th>
                        <th style={{ padding: '0.75rem 1rem', width: '150px' }}>Date &amp; Time</th>
                        <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Cashier</th>
                        <th style={{ padding: '0.75rem 1rem', width: '110px' }}>Method</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Purchase Details</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '120px' }}>Total Amount</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((trx) => (
                        <tr key={trx.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-dark)' }}>
                            {trx.id}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-medium)' }}>
                            <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-dark)', fontSize: '0.875rem' }}>{trx.date}</span>
                            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>{trx.time}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {trx.cashier}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '20px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: trx.method === 'TUNAI' ? '#ecfdf5' : (trx.method === 'QRIS' ? '#eff6ff' : '#fefce8'),
                              color: trx.method === 'TUNAI' ? '#047857' : (trx.method === 'QRIS' ? '#1d4ed8' : '#a16207'),
                              border: `1px solid ${trx.method === 'TUNAI' ? '#a7f3d0' : (trx.method === 'QRIS' ? '#bfdbfe' : '#fef08a')}`
                            }}>
                              {trx.method === 'TUNAI' ? 'CASH' : trx.method}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {trx.items && trx.items.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                                  <span style={{ color: 'var(--text-medium)', marginLeft: '0.4rem' }}>
                                    ({item.qty} x {formatRupiah(item.price)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary-hover)', fontSize: '0.925rem' }}>
                            {formatRupiah(trx.total)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(trx.id)}
                              title="Delete History Item"
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                background: '#ffffff',
                                color: '#ef4444',
                                border: '1px solid #fca5a5',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </main>

        {/* Custom Popup Confirmation / Alert Dialog Modal */}
        {dialogConfig && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.75rem 1.5rem',
                maxWidth: '380px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                animation: 'scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: dialogConfig.type === 'confirm' ? '#fef3c7' : '#fee2e2', color: dialogConfig.type === 'confirm' ? '#d97706' : '#ef4444', marginBottom: '1rem' }}>
                {dialogConfig.type === 'confirm' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 0.4rem 0' }}>
                {dialogConfig.title || (dialogConfig.type === 'confirm' ? 'Confirmation' : 'Notice')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                {dialogConfig.message}
              </p>

              {dialogConfig.type === 'confirm' ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={dialogConfig.onCancel}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-dark)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={dialogConfig.onConfirm}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: dialogConfig.isDestructive ? '#ef4444' : 'var(--primary-color)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      boxShadow: dialogConfig.isDestructive ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={dialogConfig.onConfirm}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CashierHistory;
