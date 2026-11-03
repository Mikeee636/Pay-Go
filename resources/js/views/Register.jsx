import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../api';

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [positionError, setPositionError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    setNameError('');
    setPositionError('');
    setEmailError('');
    setPhoneError('');
    setGeneralError('');

    let isValid = true;

    if (!name.trim()) {
      setNameError('Full Name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Full Name must be at least 2 characters');
      isValid = false;
    }

    if (!position.trim()) {
      setPositionError('Position is required');
      isValid = false;
    } else if (position.trim().length < 2) {
      setPositionError('Position must be at least 2 characters');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Invalid email format');
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
      setGeneralError('Registration failed. Please check the entered data.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <style>{`
        @keyframes registerCardTransition {
          from {
            opacity: 0;
            transform: translateX(300px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes registerBannerTransition {
          from {
            opacity: 0.8;
            transform: translateX(-300px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .custom-hero-banner {
          animation: registerBannerTransition 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .custom-register-card {
          background: #ffffff !important;
          border-radius: 16px !important;
          padding: 32px !important;
          border: 1px solid rgba(188, 203, 185, 0.3) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05) !important;
          font-family: 'Inter', sans-serif !important;
          position: relative !important;
          animation: registerCardTransition 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .custom-input-wrapper {
          position: relative !important;
          margin-bottom: 19px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
        }
        .custom-input-label {
          display: block !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          color: #3d4a3d !important;
          margin-left: 4px !important;
        }
        .custom-input-field {
          width: 100% !important;
          height: 44px !important;
          padding: 10px 12px 10px 46px !important;
          border-radius: 8px !important;
          border: 1px solid #bccbb9 !important;
          background-color: #f8f9ff !important;
          font-size: 16px !important;
          color: #0b1c30 !important;
          outline: none !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-sizing: border-box !important;
        }
        .custom-input-field:hover {
          border-color: #99CC33 !important;
          background-color: #ffffff !important;
        }
        .custom-input-field:focus {
          border-color: #99CC33 !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(153, 204, 51, 0.25) !important;
          transform: scale(1.01) !important;
        }
        .custom-input-field:focus + .custom-input-icon {
          color: #003333 !important;
          transform: scale(1.15) !important;
        }
        .custom-input-icon {
          position: absolute !important;
          left: 14px !important;
          bottom: 12px !important;
          color: #5f8077 !important;
          font-size: 20px !important;
          pointer-events: none !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .custom-btn {
          width: 100% !important;
          background-color: #99CC33 !important;
          color: #003333 !important;
          font-weight: 800 !important;
          font-size: 15px !important;
          padding: 10px 16px !important;
          border-radius: 8px !important;
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

      {/* Left Side: Registration Form Section */}
      <main className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#f4f8f3] relative">
        <div className="w-full max-w-[440px]">
          {/* Recreated Register Card Box */}
          <div className="custom-register-card">
            {!isSuccess ? (
              <>
                <div className="text-center" style={{ marginBottom: '24px' }}>
                  <h1 className="text-2xl font-bold text-[#003333]" style={{ marginBottom: '8px' }}>Employee Registration</h1>
                  <p className="text-slate-500" style={{ lineHeight: '1.4', fontSize: '15px' }}>
                    Complete your details to join
                  </p>
                </div>

                {generalError && (
                  <div className="custom-error-badge">
                    <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
                    <p className="flex-1 font-medium">{generalError}</p>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} noValidate>
                  {/* Name Input */}
                  <div className="custom-input-wrapper">
                    <label className="custom-input-label" htmlFor="fullName">
                      Full Name
                    </label>
                    <div className="relative w-full">
                      <input
                        className="custom-input-field"
                        style={{ borderColor: nameError ? '#f87171' : '#cbd5e1' }}
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                      />
                      <span className="material-symbols-outlined custom-input-icon">
                        person
                      </span>
                    </div>
                    {nameError && (
                      <p className="text-[11px] text-red-500 font-medium ml-1">{nameError}</p>
                    )}
                  </div>

                  {/* Position Input */}
                  <div className="custom-input-wrapper">
                    <label className="custom-input-label" htmlFor="position">
                      Position
                    </label>
                    <div className="relative w-full">
                      <input
                        className="custom-input-field"
                        style={{ borderColor: positionError ? '#f87171' : '#cbd5e1' }}
                        id="position"
                        type="text"
                        placeholder="Enter your job position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        disabled={isLoading}
                      />
                      <span className="material-symbols-outlined custom-input-icon">
                        work
                      </span>
                    </div>
                    {positionError && (
                      <p className="text-[11px] text-red-500 font-medium ml-1">{positionError}</p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="custom-input-wrapper">
                    <label className="custom-input-label" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative w-full">
                      <input
                        className="custom-input-field"
                        style={{ borderColor: emailError ? '#f87171' : '#cbd5e1' }}
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                      <span className="material-symbols-outlined custom-input-icon">
                        mail
                      </span>
                    </div>
                    {emailError && (
                      <p className="text-[11px] text-red-500 font-medium ml-1">{emailError}</p>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div className="custom-input-wrapper">
                    <label className="custom-input-label" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="relative w-full">
                      <input
                        className="custom-input-field"
                        style={{ borderColor: phoneError ? '#f87171' : '#cbd5e1' }}
                        id="phone"
                        type="tel"
                        placeholder="08123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                      />
                      <span className="material-symbols-outlined custom-input-icon">
                        call
                      </span>
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-red-500 font-medium ml-1">{phoneError}</p>
                    )}
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
                        <span>Processing Registration...</span>
                      </>
                    ) : (
                      <span>Register Now</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success View */
              <div className="text-center py-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-[#f2f9e6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#003333] text-3xl font-bold">hourglass_empty</span>
                </div>
                <h2 className="text-xl font-bold text-[#003333]">Awaiting Admin Verification</h2>
                <p className="text-slate-500 text-xs mt-3 leading-relaxed px-2">
                  Registration successful! Your account is currently in the verification process by the Admin.
                  Your Employee ID and Password will be sent to <strong>{email}</strong> once approved.
                </p>
                <div className="mt-8 pt-6 border-t border-slate-50">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003333] hover:text-[#99CC33] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Login Page
                  </Link>
                </div>
              </div>
            )}

            {/* Login redirection for normal state */}
            {!isSuccess && (
              <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                Already have an account?{' '}
                <Link to="/" className="text-[#003333] font-bold hover:text-[#99CC33] transition-colors ml-0.5">
                  Login here
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Side: Hero Image Section */}
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
    </div>
  );
}

export default Register;
