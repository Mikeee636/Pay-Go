import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../api';

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    if (role === 'Admin') navigate('/admin/summary');
    else if (role === 'Karyawan') navigate('/cashier');
  }, [navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setGeneralError('');

    let isValid = true;

    if (!username.trim()) {
      setUsernameError('Nomor Karyawan atau Email harus diisi');
      isValid = false;
    } else if (username.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username.trim())) {
        setUsernameError('Format Email Admin tidak valid');
        isValid = false;
      }
    } else if (username.trim().length < 3) {
      setUsernameError('Nomor Karyawan minimal 3 karakter');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password harus diisi');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const data = await request('/login', {
        method: 'POST',
        body: { username: username.trim(), password }
      });

      localStorage.setItem('currentUserRole', data.user.role);
      localStorage.setItem('currentUserName', data.user.name);
      localStorage.setItem('currentUserIdentifier', data.user.code || data.user.email);
      if (data.user.position) localStorage.setItem('currentUserPosition', data.user.position);

      setSuccessUser(data.user);

      setTimeout(() => {
        setIsLoading(false);
        if (data.user.role === 'Admin') navigate('/admin/summary');
        else navigate('/cashier');
      }, 1500);

    } catch (err) {
      setIsLoading(false);
      setGeneralError('Login gagal. Periksa kembali Nomor Karyawan/Email dan Password Anda.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">

        {/* Header Logo */}
        <div className="login-header">
          <div className="logo-container">
            <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
              <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="50" cy="55" r="10" fill="#ffffff" />
              <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">Pay <span className="logo-text-accent">&amp; Go</span></span>
          </div>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="card-header">
            <h1>Selamat Datang</h1>
            <p>Silakan masuk menggunakan Nomor Karyawan atau Email yang terdaftar</p>
          </div>

          {/* Error Banner */}
          {generalError && (
            <div className="error-banner" style={{ display: 'flex' }}>
              <svg className="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{generalError}</span>
              <button type="button" className="close-error-btn" onClick={() => setGeneralError('')}>x</button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="login-form" noValidate>

            <div className="input-group">
              <label htmlFor="username">Nomor Karyawan atau Email</label>
              <div className={`input-wrapper ${usernameError ? 'error' : ''}`}>
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  id="username"
                  placeholder="Contoh: 12345 atau nama@email.com"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(''); setGeneralError(''); }}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {usernameError && <span className="field-error visible">{usernameError}</span>}
            </div>

            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); alert('Silakan hubungi Administrator untuk mereset password Anda.'); }}>
                  Lupa Password?
                </a>
              </div>
              <div className={`input-wrapper ${passwordError ? 'error' : ''}`}>
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setGeneralError(''); }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <span className="field-error visible">{passwordError}</span>}
            </div>

            <div className="remember-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Ingat Saya
              </label>
            </div>

            <button type="submit" className="submit-btn" id="submitBtn" disabled={isLoading}>
              <span className={`btn-text ${isLoading ? 'hidden' : ''}`}>Masuk Ke Akun</span>
              {isLoading && !successUser && (
                <div className="spinner-container">
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                </div>
              )}
            </button>

          </form>

          <div className="card-footer">
            <p>Karyawan Baru? <Link to="/register" className="register-link">Daftar Di Sini</Link></p>
          </div>
        </div>

      </div>

      {/* Success Overlay */}
      {successUser && (
        <div className="success-overlay fade-in" style={{ display: 'flex' }}>
          <div className="success-card scale-up">
            <div className="success-icon-wrapper">
              <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="success-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2>Masuk Berhasil!</h2>
            <p>Mengarahkan ke {successUser.role === 'Admin' ? 'Admin Dashboard' : 'Dashboard Kasir'}...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
