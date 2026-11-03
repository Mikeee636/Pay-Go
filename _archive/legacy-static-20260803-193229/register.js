document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const registerForm = document.getElementById('registerForm');
  const regName = document.getElementById('regName');
  const regPosition = document.getElementById('regPosition');
  const regEmail = document.getElementById('regEmail');
  
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = document.getElementById('btnSpinner');
  
  // Field error elements
  const nameError = document.getElementById('nameError');
  const positionError = document.getElementById('positionError');
  const emailError = document.getElementById('emailError');
  
  // Section toggle elements
  const formSection = document.getElementById('formSection');
  const pendingSection = document.getElementById('pendingSection');

  // Input event listeners to clear errors on typing
  regName.addEventListener('input', () => {
    clearFieldError(regName, nameError);
  });

  regPosition.addEventListener('input', () => {
    clearFieldError(regPosition, positionError);
  });

  regEmail.addEventListener('input', () => {
    clearFieldError(regEmail, emailError);
  });

  // Submit Event
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    
    const nameVal = regName.value.trim();
    const posVal = regPosition.value.trim();
    const emailVal = regEmail.value.trim();

    // Validate Name
    if (!nameVal) {
      showFieldError(regName, nameError, 'Nama Lengkap wajib diisi');
      isValid = false;
    } else if (nameVal.length < 2) {
      showFieldError(regName, nameError, 'Nama Lengkap minimal 2 karakter');
      isValid = false;
    }

    // Validate Position
    if (!posVal) {
      showFieldError(regPosition, positionError, 'Jabatan wajib diisi');
      isValid = false;
    } else if (posVal.length < 2) {
      showFieldError(regPosition, positionError, 'Jabatan minimal 2 karakter');
      isValid = false;
    }

    // Validate Email
    if (!emailVal) {
      showFieldError(regEmail, emailError, 'Email wajib diisi');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        showFieldError(regEmail, emailError, 'Format email tidak valid');
        isValid = false;
      }
    }

    if (!isValid) return;

    // Proceed to register action
    submitRegistration(nameVal, posVal, emailVal);
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

  // Handle setting loading state
  function setLoadingState(isLoading) {
    regName.disabled = isLoading;
    regPosition.disabled = isLoading;
    regEmail.disabled = isLoading;
    submitBtn.disabled = isLoading;

    if (isLoading) {
      btnText.classList.add('hidden');
      btnSpinner.classList.remove('hidden');
    } else {
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
    }
  }

  // Simulate API registration request and store pending record in localStorage
  function submitRegistration(name, position, email) {
    setLoadingState(true);

    // Simulate server processing time (1.5 seconds)
    setTimeout(() => {
      setLoadingState(false);
      
      // Default initial employees
      const DEFAULT_EMPLOYEES = [
        { code: '12345', name: 'Budi Santoso', position: 'Kasir Utama', email: 'budi@payandgo.com', status: 'Aktif', password: 'password123' },
        { code: '12346', name: 'Siti Aminah', position: 'Kasir Shift A', email: 'siti@payandgo.com', status: 'Aktif', password: 'password123' },
        { code: '12347', name: 'Ahmad Hidayat', position: 'Kasir Shift B', email: 'ahmad@payandgo.com', status: 'Aktif', password: 'password123' }
      ];

      // Retrieve existing employees or load default
      const db = JSON.parse(localStorage.getItem('employeesDb')) || DEFAULT_EMPLOYEES;
      
      // Append the new pending employee
      db.push({
        code: '', // Pending verification has no Employee Number yet
        name: name,
        position: position,
        email: email,
        status: 'Belum Diverifikasi',
        password: '' // No password until verified by Admin
      });
      localStorage.setItem('employeesDb', JSON.stringify(db));
      
      // Successfully registered - switch sections with fade animation transition
      formSection.classList.add('hidden');
      registerForm.reset();
      pendingSection.classList.remove('hidden');
    }, 1500);
  }
});
