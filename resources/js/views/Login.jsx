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

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessNotice, setForgotSuccessNotice] = useState('');

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
      setUsernameError('Email Address is required');
      isValid = false;
    } else if (username.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username.trim())) {
        setUsernameError('Invalid Email format');
        isValid = false;
      }
    } else if (username.trim().length < 3) {
      setUsernameError('Employee ID must be at least 3 characters');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
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
      setGeneralError('Login failed. Please check your Email and Password.');
    }
  };

  // Submit Password Reset Request to Admin
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      setForgotError('Please enter your Email Address or Employee ID.');
      return;
    }

    const newReq = {
      id: 'REQ-' + Date.now(),
      identifier: forgotInput.trim(),
      requestedAt: new Date().toLocaleString('en-US'),
      status: 'PENDING'
    };

    try {
      const existing = JSON.parse(localStorage.getItem('payngo_password_reset_requests') || '[]');
      localStorage.setItem('payngo_password_reset_requests', JSON.stringify([newReq, ...existing]));
      await request('/forgot-password', {
        method: 'POST',
        body: { identifier: forgotInput.trim() }
      }).catch(() => { });
    } catch (e) {
      console.error(e);
    }

    setShowForgotModal(false);
    setForgotInput('');
    setForgotError('');
    setForgotSuccessNotice('Please wait for a response from the Admin.');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @keyframes loginCardTransition {
          from {
            opacity: 0;
            transform: translateX(-300px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes loginBannerTransition {
          from {
            opacity: 0.8;
            transform: translateX(300px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .custom-hero-banner {
          animation: loginBannerTransition 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-login-card {
          animation: loginCardTransition 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: #ffffff !important;
          border-radius: 24px !important;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid #f1f5f9 !important;
          padding: 32px !important;
        }
        .custom-input-wrapper {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          margin-bottom: 16px !important;
        }
        .custom-input-label {
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.05em !important;
          color: #475569 !important;
          text-transform: uppercase !important;
        }
        .custom-input-field {
          width: 100% !important;
          height: 44px !important;
          padding-left: 40px !important;
          padding-right: 40px !important;
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          color: #1e293b !important;
          outline: none !important;
          transition: all 0.2s ease !important;
        }
        .custom-input-field:focus {
          background-color: #ffffff !important;
          border-color: #99CC33 !important;
          box-shadow: 0 0 0 3px rgba(153, 204, 51, 0.25) !important;
        }
        .custom-input-icon {
          position: absolute !important;
          left: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #5f8077 !important;
          font-size: 20px !important;
          pointer-events: none !important;
        }
        .custom-btn {
          width: 100% !important;
          background: #99CC33 !important;
          color: #003333 !important;
          font-weight: 800 !important;
          font-size: 15px !important;
          border-radius: 12px !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          box-shadow: 0 4px 14px rgba(153, 204, 51, 0.35) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          margin-top: 24px !important;
          height: 44px !important;
        }
        .custom-btn:hover {
          background-color: #88b82e !important;
          opacity: 0.95 !important;
          transform: translateY(-3px) scale(1.01) !important;
          box-shadow: 0 8px 20px rgba(153, 204, 51, 0.5) !important;
        }
        .custom-btn:active {
          transform: translateY(1px) scale(0.96) !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
        }
        .custom-error-badge {
          margin-bottom: 16px !important;
          padding: 12px !important;
          background-color: #ffdad6 !important;
          border: 1px solid rgba(186, 26, 26, 0.2) !important;
          color: #93000a !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          display: flex !important;
          align-items: start !important;
          gap: 8px !important;
        }
        .custom-link {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: inline-block !important;
        }
        .custom-link:hover {
          transform: translateY(-1px) scale(1.05) !important;
          color: #003333 !important;
        }
      `}</style>

      {/* Left Side: Hero Image Section */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden custom-hero-banner">
        <img
          alt="Modern grocery store interior with fresh vegetables and fruits"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCBfqX27iRno2nGoHiEZD85cO1JB3HReBEoujSwBFcL78N7hp_LMexaEpHVIx0qkE21xi-sdQdIyxocI5NWW6Sm34tdcZhEb8lGuEL-9sXAs_S3n76PLkj8v355KwDrFwxKdz9Dr0U-50UzFI3FGTrjRRicJqHwSI9fUys7MdzECV_BSzEwon0yqDq5GkhQiDhXLDq3Hj-mc5U6oAWHhePKbid-D8XCCJbvsWIZAouvxfYIPiUpmk"
        />
        <div className="absolute inset-0 bg-white/40 z-0 backdrop-blur-[4px]"></div>
        <div className="relative z-10 flex flex-col w-full h-full justify-center items-center">
          <h2
            className="payngo-logo-brand text-[96px] leading-none tracking-tighter text-center"
            style={{
              fontSize: '96px',
              fontWeight: 950,
              filter: 'drop-shadow(0 8px 24px rgba(255, 255, 255, 0.9)) drop-shadow(0 4px 10px rgba(0, 51, 51, 0.2))'
            }}
          >
            <span className="pay-part">Pay</span>
            <span className="amp-part">&amp;</span>
            <span className="go-part">Go</span>
          </h2>
        </div>
      </section>

      {/* Right Side: Login Form Section */}
      <main className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#f4f8f3] relative">
        <div className="w-full max-w-[440px]">
          {/* Recreated Login Card Box */}
          <div className="custom-login-card">

            <div className="text-center" style={{ marginBottom: '24px' }}>
              <h2 className="text-xl font-bold text-[#003333]" style={{ marginBottom: '8px' }}>Welcome Back</h2>
              <p className="text-slate-500" style={{ lineHeight: '1.4', fontSize: '15px' }}>
                Please log in to your account to manage<br />payroll and transactions
              </p>
            </div>

            {/* General Login Error Badge */}
            {generalError && (
              <div className="custom-error-badge">
                <span className="material-symbols-outlined text-base leading-none">error</span>
                <span>{generalError}</span>
              </div>
            )}

            {/* Forgot Password Response Notice Banner (In English) */}
            {forgotSuccessNotice && (
              <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#f2f9e6', border: '1.5px solid #d8ecbd', color: '#003333', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined text-[#003333] text-xl">mark_email_read</span>
                <span>{forgotSuccessNotice}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              {/* Email or Employee ID Input */}
              <div className="custom-input-wrapper">
                <label className="custom-input-label" htmlFor="username">
                  Email Address / Employee ID
                </label>
                <div className="relative w-full">
                  <input
                    className="custom-input-field"
                    style={{ borderColor: usernameError ? '#f87171' : '#cbd5e1' }}
                    id="username"
                    type="text"
                    placeholder="e.g. kasir1@payngo.com or 12345"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="material-symbols-outlined custom-input-icon">
                    person
                  </span>
                </div>
                {usernameError && (
                  <p className="text-[11px] text-red-500 font-medium ml-1">{usernameError}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="custom-input-wrapper">
                <div className="flex justify-between items-center w-full" style={{ marginBottom: '4px' }}>
                  <label className="custom-input-label" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(username);
                      setForgotError('');
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-[#003333] hover:text-[#99CC33] transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative w-full">
                  <input
                    className="custom-input-field"
                    style={{ borderColor: passwordError ? '#f87171' : '#cbd5e1' }}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="material-symbols-outlined custom-input-icon">
                    lock
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center"
                    style={{ height: '30px', width: '30px' }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-red-500 font-medium ml-1">{passwordError}</p>
                )}
              </div>

              {/* Remember Me checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', marginTop: '16px', marginBottom: '16px' }}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#99CC33' }}
                />
                <label htmlFor="remember" style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '500', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                  Remember me on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="custom-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#003333]/30 border-t-[#003333] rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Redirect to register */}
            <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
              Don't have an account?{' '}
              <Link to="/register" className="text-[#003333] font-bold hover:text-[#99CC33] transition-colors ml-0.5">
                Sign up here
              </Link>
            </div>

            {/* Success Dialog Overlay */}
            {successUser && (
              <div className="absolute inset-0 z-20 bg-white/95 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-[#f2f9e6] rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#003333] text-3xl font-bold">check</span>
                </div>
                <h3 className="text-xl font-bold text-[#003333] mb-2">Login Successful!</h3>
                <p className="text-slate-500 text-sm">
                  Welcome back, <strong className="text-[#003333]">{successUser.name}</strong>.<br />
                  Redirecting to your dashboard...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Request Modal (White background centered pop up) */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '2rem 1.75rem', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', marginBottom: '1rem' }}>
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
              Reset Password Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Enter your registered Email Address or Employee ID. A password reset request will be sent to the Admin for approval.
            </p>

            <form onSubmit={handleForgotSubmit}>
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Email or Employee ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. kasir1@payngo.com or 12345"
                  value={forgotInput}
                  onChange={(e) => { setForgotInput(e.target.value); setForgotError(''); }}
                  style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
                {forgotError && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{forgotError}</p>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
