import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminName, setAdminName] = useState('Admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('payngo_admin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');

    if (role !== 'Admin') {
      alert('Access Denied! This page is restricted to Admin role.');
      localStorage.clear();
      navigate('/');
      return;
    }

    if (name) setAdminName(name);
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('payngo_admin_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to log out of Admin Dashboard?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="dashboard-body">
      <div className="dashboard-wrapper">

        {/* Sidebar Navigation (Matching Cashier Page Style) */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            {/* Toggle Sidebar Button */}
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
            <div className="user-avatar" title="Administrator">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">Administrator</span>
              <span className="user-role">System Admin</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <NavLink to="/admin/summary" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Ringkasan Dashboard">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              <span className="menu-text-label">Dashboard Summary</span>
            </NavLink>
            <NavLink to="/admin/products" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Manage Products">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span className="menu-text-label">Manage Products</span>
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Manage Categories">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="menu-text-label">Manage Categories</span>
            </NavLink>
            <NavLink to="/admin/stock" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Manage Stock">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon>
                <polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"></polygon>
                <polygon points="12 12 21 6.92 12 1.84 3 6.92 12 12"></polygon>
              </svg>
              <span className="menu-text-label">Manage Stock</span>
            </NavLink>
            <NavLink to="/admin/employees" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Manage Employees">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="menu-text-label">Manage Employees</span>
            </NavLink>
            <NavLink to="/admin/transactions" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Transaction Report">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span className="menu-text-label">Transaction Report</span>
            </NavLink>
            <NavLink to="/admin/sales" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Sales Report">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12" y2="6"></line>
                <line x1="6" y1="18" x2="6" y2="12"></line>
                <line x1="18" y1="18" x2="18" y2="9"></line>
              </svg>
              <span className="menu-text-label">Sales Report</span>
            </NavLink>

            <div className="sidebar-footer">
              <a href="#" className="menu-item logout" onClick={handleLogout} title="Logout">
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

        {/* Dynamic Nested Route Content */}
        <Outlet />

      </div>
    </div>
  );
}

export default AdminLayout;
