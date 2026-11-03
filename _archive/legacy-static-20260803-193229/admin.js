// Role Protection (Constraint: Only Admin can access)
(function protectRoute() {
  const userRole = localStorage.getItem('currentUserRole');
  if (userRole !== 'Admin') {
    alert('Akses Ditolak! Halaman ini hanya dapat diakses oleh Admin.');
    window.location.href = 'index.html';
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const adminName = document.getElementById('adminName');
  const liveClock = document.getElementById('liveClock');
  const logoutBtn = document.getElementById('logoutBtn');

  // Dynamic Session Parsing
  const activeUserName = localStorage.getItem('currentUserName');
  if (activeUserName && adminName) {
    adminName.textContent = activeUserName;
  }

  // Live ticking clock
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

  // Logout Handler
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Apakah Anda yakin ingin keluar dari Dashboard Admin?')) {
      // Clear session values
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentUserName');
      
      // Redirect to Login Page
      window.location.href = 'index.html';
    }
  });
});
