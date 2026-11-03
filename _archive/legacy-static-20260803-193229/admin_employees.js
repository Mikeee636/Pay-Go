// Role Protection (Constraint: Only Admin can access)
(function protectRoute() {
  const userRole = localStorage.getItem('currentUserRole');
  if (userRole !== 'Admin') {
    alert('Akses Ditolak! Halaman ini hanya dapat diakses oleh Admin.');
    window.location.href = 'index.html';
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // Employee Database Default Initializer
  // ==========================================================================
  const DEFAULT_EMPLOYEES = [
    { code: '12345', name: 'Budi Santoso', position: 'Kasir Utama', email: 'budi@payandgo.com', status: 'Aktif', password: 'password123' },
    { code: '12346', name: 'Siti Aminah', position: 'Kasir Shift A', email: 'siti@payandgo.com', status: 'Aktif', password: 'password123' },
    { code: '12347', name: 'Ahmad Hidayat', position: 'Kasir Shift B', email: 'ahmad@payandgo.com', status: 'Aktif', password: 'password123' }
  ];

  // ==========================================================================
  // State Management
  // ==========================================================================
  let activeEditEmail = null;
  let activeVerifyEmail = null;
  let activeResetEmail = null;

  function getEmployees() {
    if (!localStorage.getItem('employeesDb')) {
      localStorage.setItem('employeesDb', JSON.stringify(DEFAULT_EMPLOYEES));
    }
    return JSON.parse(localStorage.getItem('employeesDb'));
  }

  function saveEmployees(employees) {
    localStorage.setItem('employeesDb', JSON.stringify(employees));
  }

  // ==========================================================================
  // DOM Elements Selection
  // ==========================================================================
  const adminName = document.getElementById('adminName');
  const liveClock = document.getElementById('liveClock');
  const logoutBtn = document.getElementById('logoutBtn');

  const searchQuery = document.getElementById('searchQuery');
  const employeeTableBody = document.getElementById('employeeTableBody');

  // Modal 1: Edit Modal
  const employeeModal = document.getElementById('employeeModal');
  const editEmployeeForm = document.getElementById('editEmployeeForm');
  const empName = document.getElementById('empName');
  const empPosition = document.getElementById('empPosition');
  const empEmail = document.getElementById('empEmail');
  const empNameError = document.getElementById('empNameError');
  const empPositionError = document.getElementById('empPositionError');
  const empEmailError = document.getElementById('empEmailError');
  const closeEditModalXBtn = document.getElementById('closeEditModalXBtn');
  const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');

  // Modal 2: Verify Modal
  const verifyModal = document.getElementById('verifyModal');
  const verifyEmployeeForm = document.getElementById('verifyEmployeeForm');
  const verifyCode = document.getElementById('verifyCode');
  const verifyPassword = document.getElementById('verifyPassword');
  const verifyCodeError = document.getElementById('verifyCodeError');
  const verifyPasswordError = document.getElementById('verifyPasswordError');
  const closeVerifyModalXBtn = document.getElementById('closeVerifyModalXBtn');
  const cancelVerifyModalBtn = document.getElementById('cancelVerifyModalBtn');

  // Modal 3: Reset Modal
  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const resetTargetName = document.getElementById('resetTargetName');
  const resetPassword = document.getElementById('resetPassword');
  const resetPasswordError = document.getElementById('resetPasswordError');
  const closeResetModalXBtn = document.getElementById('closeResetModalXBtn');
  const cancelResetModalBtn = document.getElementById('cancelResetModalBtn');

  // ==========================================================================
  // Clock and User Sessions
  // ==========================================================================
  const activeUserName = localStorage.getItem('currentUserName');
  if (activeUserName && adminName) {
    adminName.textContent = activeUserName;
  }

  function updateClock() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    liveClock.textContent = `${dayName}, ${dateNum} ${monthName} ${year} | ${hours}:${minutes}:${seconds}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Logout
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Apakah Anda yakin ingin keluar dari Dashboard Admin?')) {
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentUserName');
      window.location.href = 'index.html';
    }
  });

  // ==========================================================================
  // Table Rendering
  // ==========================================================================
  function renderEmployeesTable() {
    const employees = getEmployees();
    const query = searchQuery.value.trim().toLowerCase();

    // Filter list
    const filteredEmployees = employees.filter(emp => 
      emp.name.toLowerCase().includes(query) || 
      emp.email.toLowerCase().includes(query) ||
      emp.code.includes(query)
    );

    // Clear previous rows
    employeeTableBody.innerHTML = '';

    if (filteredEmployees.length === 0) {
      employeeTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
            Tidak ada karyawan yang ditemukan.
          </td>
        </tr>
      `;
      return;
    }

    filteredEmployees.forEach((emp, index) => {
      const tr = document.createElement('tr');
      
      // Status styling logic
      let badgeClass = '';
      if (emp.status === 'Aktif') badgeClass = 'badge-safe';
      else if (emp.status === 'Nonaktif') badgeClass = 'badge-danger';
      else badgeClass = 'badge-warning';

      // Action column buttons based on status
      let actionButtons = '';
      if (emp.status === 'Belum Diverifikasi') {
        actionButtons = `
          <button class="action-btn verify-trigger" data-email="${emp.email}" style="background-color: var(--primary-color);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Verifikasi
          </button>
        `;
      } else {
        const toggleText = emp.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan';
        const toggleClass = emp.status === 'Aktif' ? 'delete-btn' : 'verify-trigger-small';
        const toggleBg = emp.status === 'Aktif' ? 'var(--error-text)' : 'var(--primary-color)';
        
        actionButtons = `
          <button class="action-btn edit-trigger" data-email="${emp.email}">
            Edit
          </button>
          <button class="action-btn reset-trigger" data-email="${emp.email}" style="background-color: #718096;">
            Reset PW
          </button>
          <button class="action-btn toggle-status-trigger" data-email="${emp.email}" style="background-color: ${toggleBg};">
            ${toggleText}
          </button>
        `;
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="text-align: center; font-weight: 600;" class="prod-code-cell">${emp.code || '-'}</td>
        <td class="prod-name-cell">${emp.name}</td>
        <td style="font-weight: 500;">${emp.position}</td>
        <td>${emp.email}</td>
        <td style="text-align: center;">
          <span class="badge ${badgeClass}">${emp.status}</span>
        </td>
        <td style="text-align: center;">
          <div class="action-cell" style="gap: 0.35rem;">
            ${actionButtons}
          </div>
        </td>
      `;

      // Bind events
      const verifyBtn = tr.querySelector('.verify-trigger');
      if (verifyBtn) {
        verifyBtn.addEventListener('click', () => openVerifyModal(emp));
      }

      const editBtn = tr.querySelector('.edit-trigger');
      if (editBtn) {
        editBtn.addEventListener('click', () => openEditModal(emp));
      }

      const resetBtn = tr.querySelector('.reset-trigger');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => openResetModal(emp));
      }

      const toggleBtn = tr.querySelector('.toggle-status-trigger');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleEmployeeStatus(emp));
      }

      employeeTableBody.appendChild(tr);
    });
  }

  searchQuery.addEventListener('input', renderEmployeesTable);

  // ==========================================================================
  // Modal Control Functions
  // ==========================================================================
  
  // Modal 1: Edit
  function openEditModal(emp) {
    activeEditEmail = emp.email;
    empName.value = emp.name;
    empPosition.value = emp.position;
    empEmail.value = emp.email;
    
    clearInputError(empName, empNameError);
    clearInputError(empPosition, empPositionError);
    clearInputError(empEmail, empEmailError);
    
    employeeModal.classList.remove('hidden');
    empName.focus();
  }

  function closeEditModal() {
    employeeModal.classList.add('hidden');
    activeEditEmail = null;
  }

  // Modal 2: Verify
  function openVerifyModal(emp) {
    activeVerifyEmail = emp.email;
    verifyCode.value = '';
    verifyPassword.value = '';
    
    clearInputError(verifyCode, verifyCodeError);
    clearInputError(verifyPassword, verifyPasswordError);
    
    verifyModal.classList.remove('hidden');
    verifyCode.focus();
  }

  function closeVerifyModal() {
    verifyModal.classList.add('hidden');
    activeVerifyEmail = null;
  }

  // Modal 3: Reset PW
  function openResetModal(emp) {
    activeResetEmail = emp.email;
    resetTargetName.textContent = `${emp.name} (${emp.code})`;
    resetPassword.value = '';
    
    clearInputError(resetPassword, resetPasswordError);
    
    resetPasswordModal.classList.remove('hidden');
    resetPassword.focus();
  }

  function closeResetModal() {
    resetPasswordModal.classList.add('hidden');
    activeResetEmail = null;
  }

  // Helper clear/show errors
  function clearInputError(inputEl, errorEl) {
    errorEl.classList.remove('visible');
    inputEl.closest('.input-wrapper').classList.remove('error');
  }

  function showInputError(inputEl, errorEl, message) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    inputEl.closest('.input-wrapper').classList.add('error');
  }

  // Bind close events
  closeEditModalXBtn.addEventListener('click', closeEditModal);
  cancelEditModalBtn.addEventListener('click', closeEditModal);
  employeeModal.addEventListener('click', (e) => { if (e.target === employeeModal) closeEditModal(); });

  closeVerifyModalXBtn.addEventListener('click', closeVerifyModal);
  cancelVerifyModalBtn.addEventListener('click', closeVerifyModal);
  verifyModal.addEventListener('click', (e) => { if (e.target === verifyModal) closeVerifyModal(); });

  closeResetModalXBtn.addEventListener('click', closeResetModal);
  cancelResetModalBtn.addEventListener('click', closeResetModal);
  resetPasswordModal.addEventListener('click', (e) => { if (e.target === resetPasswordModal) closeResetModal(); });

  // Clear errors on typing
  empName.addEventListener('input', () => clearInputError(empName, empNameError));
  empPosition.addEventListener('input', () => clearInputError(empPosition, empPositionError));
  empEmail.addEventListener('input', () => clearInputError(empEmail, empEmailError));
  verifyCode.addEventListener('input', () => clearInputError(verifyCode, verifyCodeError));
  verifyPassword.addEventListener('input', () => clearInputError(verifyPassword, verifyPasswordError));
  resetPassword.addEventListener('input', () => clearInputError(resetPassword, resetPasswordError));

  // ==========================================================================
  // Form Submit Handlers
  // ==========================================================================
  
  // Submit 1: Edit Employee Account Details
  editEmployeeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const nameVal = empName.value.trim();
    const posVal = empPosition.value.trim();
    const emailVal = empEmail.value.trim();

    if (!nameVal) {
      showInputError(empName, empNameError, 'Nama wajib diisi');
      isValid = false;
    }
    if (!posVal) {
      showInputError(empPosition, empPositionError, 'Jabatan wajib diisi');
      isValid = false;
    }
    if (!emailVal) {
      showInputError(empEmail, empEmailError, 'Email wajib diisi');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showInputError(empEmail, empEmailError, 'Format email tidak valid');
      isValid = false;
    }

    if (!isValid) return;

    const employees = getEmployees();
    
    // Check duplicate email (if email is changing)
    if (emailVal.toLowerCase() !== activeEditEmail.toLowerCase()) {
      if (employees.some(emp => emp.email.toLowerCase() === emailVal.toLowerCase())) {
        showInputError(empEmail, empEmailError, 'Email tersebut sudah digunakan karyawan lain!');
        return;
      }
    }

    const index = employees.findIndex(emp => emp.email === activeEditEmail);
    if (index !== -1) {
      employees[index].name = nameVal;
      employees[index].position = posVal;
      employees[index].email = emailVal;
      
      saveEmployees(employees);
      closeEditModal();
      renderEmployeesTable();
    }
  });

  // Submit 2: Verify and Activate pending account
  verifyEmployeeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const codeVal = verifyCode.value.trim();
    const passwordVal = verifyPassword.value;

    if (!codeVal) {
      showInputError(verifyCode, verifyCodeError, 'Nomor Karyawan wajib diisi');
      isValid = false;
    } else if (codeVal.length < 3) {
      showInputError(verifyCode, verifyCodeError, 'Nomor Karyawan minimal 3 karakter');
      isValid = false;
    }

    if (!passwordVal) {
      showInputError(verifyPassword, verifyPasswordError, 'Password wajib diisi');
      isValid = false;
    } else if (passwordVal.length < 6) {
      showInputError(verifyPassword, verifyPasswordError, 'Password minimal 6 karakter');
      isValid = false;
    }

    if (!isValid) return;

    const employees = getEmployees();

    // Check unique employee code
    if (employees.some(emp => emp.code === codeVal)) {
      showInputError(verifyCode, verifyCodeError, 'Nomor Karyawan tersebut sudah digunakan!');
      return;
    }

    const index = employees.findIndex(emp => emp.email === activeVerifyEmail);
    if (index !== -1) {
      employees[index].code = codeVal;
      employees[index].password = passwordVal;
      employees[index].status = 'Aktif';
      
      saveEmployees(employees);
      closeVerifyModal();
      renderEmployeesTable();
    }
  });

  // Submit 3: Reset Password
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const passwordVal = resetPassword.value;

    if (!passwordVal) {
      showInputError(resetPassword, resetPasswordError, 'Password wajib diisi');
      return;
    } else if (passwordVal.length < 6) {
      showInputError(resetPassword, resetPasswordError, 'Password minimal 6 karakter');
      return;
    }

    const employees = getEmployees();
    const index = employees.findIndex(emp => emp.email === activeResetEmail);
    if (index !== -1) {
      employees[index].password = passwordVal;
      
      saveEmployees(employees);
      closeResetModal();
      alert('Password berhasil disetel ulang.');
      renderEmployeesTable();
    }
  });

  // ==========================================================================
  // Toggle Employee status (Aktif <-> Nonaktif)
  // ==========================================================================
  function toggleEmployeeStatus(emp) {
    const nextStatus = emp.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const actionLabel = emp.status === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan';

    if (confirm(`Apakah Anda yakin ingin ${actionLabel} akun karyawan '${emp.name}'?`)) {
      const employees = getEmployees();
      const index = employees.findIndex(e => e.email === emp.email);
      
      if (index !== -1) {
        employees[index].status = nextStatus;
        saveEmployees(employees);
        renderEmployeesTable();
      }
    }
  }

  // ==========================================================================
  // Initial Table Render
  // ==========================================================================
  renderEmployeesTable();
});
