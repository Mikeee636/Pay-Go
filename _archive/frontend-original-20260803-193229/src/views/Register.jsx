import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../api';

function Register() {
  const navigate = useNavigate();

  // Inputs
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field Errors
  const [nameError, setNameError] = useState('');
  const [positionError, setPositionError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Clear errors
    setNameError('');
    setPositionError('');
    setEmailError('');
    setGeneralError('');

    let isValid = true;

    if (!name.trim()) {
      setNameError('Nama Lengkap wajib diisi');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Nama Lengkap minimal 2 karakter');
      isValid = false;
    }

    if (!position.trim()) {
      setPositionError('Jabatan wajib diisi');
      isValid = false;
    } else if (position.trim().length < 2) {
      setPositionError('Jabatan minimal 2 karakter');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email wajib diisi');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Format email tidak valid');
        isValid = false;
      }
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      await request('/register', {
        method: 'POST',
        body: {
          name: name.trim(),
          position: position.trim(),
          email: email.trim()
        }
      });

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setGeneralError('Registrasi belum berhasil. Periksa kembali data yang diisi.');
    }
  };

  return (
    <div className="login-body" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
      <div className="login-card-container">
        
        {/* Logo and Headings */}
        <header className="login-header">
          <div className="logo-container">
            <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
              <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="50" cy="55" r="10" fill="#ffffff" />
              <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="logo-text">Pay <span className="logo-text-accent">&amp; Go</span></span>
          </div>
        </header>

        {/* Section 1: Form Section */}
        {!isSuccess ? (
          <div id="formSection" className="fade-in">
            <div className="login-header">
              <h1>Registrasi Karyawan</h1>
              <p>Isi data karyawan untuk mengajukan akses Pay & Go</p>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="error-banner" style={{ display: 'flex', marginBottom: '1.25rem' }}>
                <span className="error-message">{generalError}</span>
                <button type="button" className="close-error-btn" onClick={() => setGeneralError('')}>&times;</button>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} noValidate>
              
              <div className="input-group">
                <label htmlFor="regName">Nama Lengkap</label>
                <div className={`input-wrapper ${nameError ? 'error' : ''}`}>
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    type="text" 
                    id="regName" 
                    placeholder="Masukkan nama lengkap Anda"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {nameError && <span className="field-error visible">{nameError}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="regPosition">Jabatan</label>
                <div className={`input-wrapper ${positionError ? 'error' : ''}`}>
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <input 
                    type="text" 
                    id="regPosition" 
                    placeholder="Contoh: Kasir Shift A, Staf Toko..."
                    value={position}
                    onChange={(e) => { setPosition(e.target.value); setPositionError(''); }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {positionError && <span className="field-error visible">{positionError}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="regEmail">Alamat Email</label>
                <div className={`input-wrapper ${emailError ? 'error' : ''}`}>
                  <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input 
                    type="email" 
                    id="regEmail" 
                    placeholder="Contoh: budi@payandgo.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {emailError && <span className="field-error visible">{emailError}</span>}
              </div>

              <button type="submit" className="login-btn" id="submitBtn" disabled={isLoading}>
                <span className={`btn-text ${isLoading ? 'hidden' : ''}`}>Ajukan Pendaftaran</span>
                <div className={`spinner ${isLoading ? '' : 'hidden'}`} id="btnSpinner"></div>
              </button>

            </form>

            <div className="login-footer">
              <p>Sudah punya akun? <Link to="/">Masuk Ke Akun</Link></p>
            </div>
          </div>
        ) : (
          /* Section 2: Pending Successful Verification Card */
          <div id="pendingSection" className="pending-success-card fade-in">
            <div className="pending-icon-wrapper">
              <svg className="pending-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h2>Menunggu Verifikasi Admin</h2>
            <p className="pending-lead">Data registrasi Anda berhasil dikirim dan sedang menunggu pengecekan.</p>
            
            <div className="pending-notice-box">
              <span className="notice-badge">MENUNGGU VERIFIKASI ADMIN</span>
              <p>Nomor Karyawan dan Password sementara akan dikirim melalui email setelah akun diverifikasi oleh Admin.</p>
            </div>

            <button type="button" className="login-btn" onClick={() => navigate('/')}>
              Kembali Ke Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Register;
