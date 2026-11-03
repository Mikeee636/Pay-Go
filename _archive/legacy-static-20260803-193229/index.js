document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = document.getElementById('btnSpinner');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const closeErrorBtn = document.getElementById('closeErrorBtn');
  
  // Input Validation Error elements
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  
  // Password Visibility Toggle
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  // Simulated User Databases
  const DEMO_ADMIN = {
    email: 'admin@payandgo.com',
    password: 'admin123',
    name: 'Administrator Pay & Go'
  };

  const DEMO_EMPLOYEE = {
    id: '12345',
    password: 'password123',
    name: 'Budi Santoso'
  };

  // Toggle Password visibility logic
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    if (isPassword) {
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
      togglePasswordBtn.setAttribute('aria-label', 'Sembunyikan password');
    } else {
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
      togglePasswordBtn.setAttribute('aria-label', 'Tampilkan password');
    }
  });

  // Close Error Banner
  closeErrorBtn.addEventListener('click', () => {
    hideError();
  });

  // Reset errors on input change
  usernameInput.addEventListener('input', () => {
    clearFieldError(usernameInput, usernameError);
    hideError();
  });

  passwordInput.addEventListener('input', () => {
    clearFieldError(passwordInput, passwordError);
    hideError();
  });

  // Form Submit Handler
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Reset status
    hideError();
    let isValid = true;

    const usernameValue = usernameInput.value.trim();
    const passwordValue = passwordInput.value;

    // Validate Username / Email
    if (!usernameValue) {
      showFieldError(usernameInput, usernameError, 'Nomor Karyawan atau Email harus diisi');
      isValid = false;
    } else if (usernameValue.includes('@')) {
      // Basic Email Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(usernameValue)) {
        showFieldError(usernameInput, usernameError, 'Format Email Admin tidak valid');
        isValid = false;
      }
    } else {
      // Employee Number Validation (ensure it is alphanumeric/numeric, minimum length of 3)
      if (usernameValue.length < 3) {
        showFieldError(usernameInput, usernameError, 'Nomor Karyawan minimal 3 karakter');
        isValid = false;
      }
    }

    // Validate Password
    if (!passwordValue) {
      showFieldError(passwordInput, passwordError, 'Password harus diisi');
      isValid = false;
    } else if (passwordValue.length < 6) {
      showFieldError(passwordInput, passwordError, 'Password minimal 6 karakter');
      isValid = false;
    }

    if (!isValid) return;

    // Proceed to Simulated API Login call
    performLogin(usernameValue, passwordValue);
  });

  // Helper function to show input validation error
  function showFieldError(inputEl, errorEl, message) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    inputEl.closest('.input-wrapper').classList.add('error');
  }

  // Helper function to clear input validation error
  function clearFieldError(inputEl, errorEl) {
    errorEl.classList.remove('visible');
    inputEl.closest('.input-wrapper').classList.remove('error');
  }

  // Helper function to show general error banner
  function showError(messageText) {
    errorMessage.textContent = messageText;
    errorBanner.classList.remove('hidden');
  }

  // Helper function to hide general error banner
  function hideError() {
    errorBanner.classList.add('hidden');
  }

  // Simulating API communication
  function performLogin(username, password) {
    // Disable inputs and buttons
    setLoadingState(true);

    // Simulate backend response time (1.5 seconds)
    setTimeout(() => {
      // Determine if Admin or Employee based on @ symbol (anonymous role check)
      const isAdminAttempt = username.includes('@');
      
      let authenticatedUser = null;
      let statusErrorMsg = '';

      if (isAdminAttempt) {
        // Verify Admin Credentials
        if (username.toLowerCase() === DEMO_ADMIN.email.toLowerCase() && password === DEMO_ADMIN.password) {
          authenticatedUser = {
            role: 'Admin',
            name: DEMO_ADMIN.name,
            identifier: DEMO_ADMIN.email
          };
        }
      } else {
        // Verify Employee Credentials from localStorage employeesDb
        const DEFAULT_EMPLOYEES = [
          { code: '12345', name: 'Budi Santoso', position: 'Kasir Utama', email: 'budi@payandgo.com', status: 'Aktif', password: 'password123' },
          { code: '12346', name: 'Siti Aminah', position: 'Kasir Shift A', email: 'siti@payandgo.com', status: 'Aktif', password: 'password123' },
          { code: '12347', name: 'Ahmad Hidayat', position: 'Kasir Shift B', email: 'ahmad@payandgo.com', status: 'Aktif', password: 'password123' }
        ];

        const db = JSON.parse(localStorage.getItem('employeesDb')) || DEFAULT_EMPLOYEES;
        const employee = db.find(emp => emp.code === username);

        if (employee) {
          if (employee.status === 'Belum Diverifikasi') {
            statusErrorMsg = 'Login gagal. Akun Anda belum diverifikasi oleh Admin.';
          } else if (employee.status === 'Nonaktif') {
            statusErrorMsg = 'Login gagal. Akun Anda telah dinonaktifkan. Silakan hubungi Admin.';
          } else if (employee.status === 'Aktif') {
            if (employee.password === password) {
              authenticatedUser = {
                role: 'Karyawan',
                name: employee.name,
                identifier: employee.code
              };
            }
          }
        }
      }

      if (authenticatedUser) {
        // Success
        handleLoginSuccess(authenticatedUser);
      } else {
        // Failure - show clean, secure error message (or status specific message)
        setLoadingState(false);
        showError(statusErrorMsg || 'Login gagal. Silakan periksa kembali Nomor Karyawan/Email dan Password Anda.');
      }
    }, 1500);
  }

  // Handle setting loading state UI
  function setLoadingState(isLoading) {
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    rememberMeCheckbox.disabled = isLoading;
    submitBtn.disabled = isLoading;

    if (isLoading) {
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
    } else {
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
    }
  }

  // Display Premium login success screen (Only revealing the role AFTER success)
  function handleLoginSuccess(user) {
    // Create and display a gorgeous full-screen success overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
      <div class="success-content">
        <div class="success-checkmark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h2>Login Berhasil!</h2>
        <p class="welcome-msg">Selamat datang kembali, <strong>${user.name}</strong></p>
        <div class="role-badge ${user.role.toLowerCase()}">${user.role}</div>
        <p class="redirect-msg">Mengalihkan Anda ke halaman dashboard...</p>
      </div>
    `;

    // Add style to document for overlay
    const style = document.createElement('style');
    style.innerHTML = `
      .success-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.96);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: overlayFadeIn 0.4s ease-out forwards;
      }
      .success-content {
        text-align: center;
        max-width: 400px;
        padding: 2.5rem;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(46, 204, 113, 0.1);
        border: 1px solid var(--border-color);
        transform: scale(0.9);
        animation: contentScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .success-content h2 {
        font-family: var(--font-heading);
        font-size: 1.8rem;
        color: var(--text-dark);
        margin: 1.5rem 0 0.5rem 0;
      }
      .welcome-msg {
        color: var(--text-medium);
        font-size: 0.95rem;
        margin-bottom: 1.25rem;
      }
      .role-badge {
        display: inline-block;
        padding: 0.35rem 1rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: 30px;
        margin-bottom: 1.5rem;
      }
      .role-badge.admin {
        background-color: hsl(200, 70%, 93%);
        color: hsl(200, 80%, 30%);
      }
      .role-badge.karyawan {
        background-color: hsl(142, 70%, 93%);
        color: hsl(142, 80%, 25%);
      }
      .redirect-msg {
        color: var(--text-light);
        font-size: 0.825rem;
        animation: pulse 1.5s infinite;
      }
      
      /* Checkmark Animation */
      .success-checkmark {
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }
      .checkmark__circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 2;
        stroke-miterlimit: 10;
        stroke: var(--primary-color);
        fill: none;
        animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
      }
      .checkmark__check {
        transform-origin: 50% 50%;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        stroke-width: 3;
        stroke: var(--primary-color);
        animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
      }

      @keyframes stroke {
        100% {
          stroke-dashoffset: 0;
        }
      }
      @keyframes overlayFadeIn {
        to { background-color: rgba(255, 255, 255, 0.96); }
      }
      @keyframes contentScaleUp {
        to { transform: scale(1); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Save session details in localStorage for route protection
    localStorage.setItem('currentUserRole', user.role);
    localStorage.setItem('currentUserName', user.name);

    // Redirection after success display
    setTimeout(() => {
      overlay.remove();
      setLoadingState(false);
      
      if (user.role === 'Admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'cashier.html';
      }
    }, 2000);
  }
});
