import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');
    
    if (role !== 'Admin') {
      alert('Akses Ditolak! Halaman ini hanya dapat diakses oleh Admin.');
      localStorage.clear();
      navigate('/');
      return;
    }
    
    if (name) setAdminName(name);
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm('Apakah Anda yakin ingin keluar dari Dashboard Admin?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="dashboard-body">
      <div className="dashboard-wrapper">
        
        {/* Sidebar Navigation (Green Theme for Admin) */}
        <aside className="sidebar admin-sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              {/* White SVG Logo variant */}
              <svg className="logo-icon logo-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="30" width="60" height="50" rx="12" fill="#ffffff" />
                <path d="M35,30 C35,18 40,12 50,12 C60,12 65,30" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="55" r="10" fill="var(--primary-color)" />
                <path d="M47,55 L52,60 L60,49" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="logo-text text-white">Pay <span className="logo-text-accent text-white-accent">&amp; Go</span></span>
            </div>
          </div>

          <div className="user-profile-card admin-profile-card">
            <div className="user-avatar admin-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name text-white">{adminName}</span>
              <span className="user-role text-white-muted">Administrator</span>
            </div>
          </div>

          <nav className="sidebar-menu admin-menu">
            <NavLink to="/admin/summary" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Ringkasan Dashboard
            </NavLink>
            <NavLink to="/admin/products" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Kelola Produk
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              Kelola Kategori
            </NavLink>
            <NavLink to="/admin/stock" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon>
                <polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"></polygon>
                <polygon points="12 12 21 6.92 12 1.84 3 6.92 12 12"></polygon>
              </svg>
              Kelola Stok
            </NavLink>
            <NavLink to="/admin/employees" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Kelola Karyawan
            </NavLink>
            <NavLink to="/admin/transactions" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Laporan Transaksi
            </NavLink>
            <NavLink to="/admin/sales" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12" y2="6"></line>
                <line x1="6" y1="18" x2="6" y2="12"></line>
                <line x1="18" y1="18" x2="18" y2="9"></line>
              </svg>
              Laporan Penjualan
            </NavLink>

            <div className="menu-divider admin-divider"></div>
            <a href="#" className="menu-item logout admin-logout" onClick={handleLogout}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Keluar
            </a>
          </nav>
        </aside>

        {/* Dynamic Nested Route Content */}
        <Outlet />

      </div>
    </div>
  );
}

export default AdminLayout;
