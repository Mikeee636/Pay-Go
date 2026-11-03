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
  // Transaction Database Default Initializer
  // ==========================================================================
  const DEFAULT_TRANSACTIONS = [
    { id: 'TRX-20260803-8712', date: '2026-08-03', time: '16:04', cashier: 'Budi Santoso', subtotal: 65765, tax: 7235, total: 73000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 2, price: 18000 }, { name: 'Minyak Goreng Sawit Refill 2L', qty: 1, price: 34000 }] },
    { id: 'TRX-20260803-1254', date: '2026-08-03', time: '15:52', cashier: 'Budi Santoso', subtotal: 16216, tax: 1784, total: 18000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 1, price: 18000 }] },
    { id: 'TRX-20260803-3498', date: '2026-08-03', time: '15:40', cashier: 'Siti Aminah', subtotal: 112162, tax: 12338, total: 124500, items: [{ name: 'Roti Tawar Gandum FreshMarket', qty: 2, price: 15000 }, { name: 'Susu Cair UHT Full Cream 1L', qty: 3, price: 22000 }] },
    { id: 'TRX-20260803-6231', date: '2026-08-03', time: '15:15', cashier: 'Ahmad Hidayat', subtotal: 37838, tax: 4162, total: 42000, items: [{ name: 'Susu Cair UHT Full Cream 1L', qty: 1, price: 22000 }, { name: 'Teh Hijau Jasmine Botol 450ml', qty: 3, price: 6000 }] },
    { id: 'TRX-20260803-9021', date: '2026-08-03', time: '14:50', cashier: 'Siti Aminah', subtotal: 230630, tax: 25370, total: 256000, items: [{ name: 'Minyak Goreng Sawit Refill 2L', qty: 5, price: 34000 }, { name: 'Sabun Mandi Cair Lemon 400ml', qty: 3, price: 26000 }] }
  ];

  // ==========================================================================
  // State Management
  // ==========================================================================
  let selectedTransaction = null;

  function getTransactions() {
    if (!localStorage.getItem('transactionsDb')) {
      localStorage.setItem('transactionsDb', JSON.stringify(DEFAULT_TRANSACTIONS));
    }
    return JSON.parse(localStorage.getItem('transactionsDb'));
  }

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const adminName = document.getElementById('adminName');
  const liveClock = document.getElementById('liveClock');
  const logoutBtn = document.getElementById('logoutBtn');

  // Filters & Controls
  const searchQuery = document.getElementById('searchQuery');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const resetDateBtn = document.getElementById('resetDateBtn');
  const transactionTableBody = document.getElementById('transactionTableBody');

  // Stats Card Value Nodes
  const totalRevenueNode = document.getElementById('totalRevenue');
  const totalTaxNode = document.getElementById('totalTax');
  const totalTrxNode = document.getElementById('totalTrx');
  const avgCartNode = document.getElementById('avgCart');

  // Detail Modal
  const transactionDetailModal = document.getElementById('transactionDetailModal');
  const closeDetailModalXBtn = document.getElementById('closeDetailModalXBtn');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const printDetailBtn = document.getElementById('printDetailBtn');

  const detailTrxId = document.getElementById('detailTrxId');
  const detailDate = document.getElementById('detailDate');
  const detailCashier = document.getElementById('detailCashier');
  const detailItemsBody = document.getElementById('detailItemsBody');
  const detailSubtotal = document.getElementById('detailSubtotal');
  const detailTax = document.getElementById('detailTax');
  const detailTotal = document.getElementById('detailTotal');

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
  // Formatting Helpers
  // ==========================================================================
  function formatRupiah(number) {
    return 'Rp ' + number.toLocaleString('id-ID');
  }

  function formatDateDisplay(dateStr, timeStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]} ${timeStr}`;
    }
    return `${dateStr} ${timeStr}`;
  }

  // ==========================================================================
  // Calculation & Table Rendering
  // ==========================================================================
  function renderTransactionsTable() {
    const transactions = getTransactions();
    const query = searchQuery.value.trim().toLowerCase();
    const startVal = startDate.value; // YYYY-MM-DD
    const endVal = endDate.value;     // YYYY-MM-DD

    // 1. Filter Transactions based on search query AND date range
    const filteredTrx = transactions.filter(trx => {
      // Text match (Invoice ID or Cashier)
      const matchesText = trx.id.toLowerCase().includes(query) || 
                          trx.cashier.toLowerCase().includes(query);

      // Date range match
      let matchesDate = true;
      if (startVal) {
        matchesDate = matchesDate && (trx.date >= startVal);
      }
      if (endVal) {
        matchesDate = matchesDate && (trx.date <= endVal);
      }

      return matchesText && matchesDate;
    });

    // 2. Compute dynamic stats on filtered records
    let revenueSum = 0;
    let taxSum = 0;
    let trxCount = filteredTrx.length;

    filteredTrx.forEach(trx => {
      revenueSum += trx.total;
      taxSum += trx.tax;
    });

    const avgCart = trxCount > 0 ? Math.round(revenueSum / trxCount) : 0;

    // Render stats card values
    totalRevenueNode.textContent = formatRupiah(revenueSum);
    totalTaxNode.textContent = formatRupiah(taxSum);
    totalTrxNode.textContent = trxCount;
    avgCartNode.textContent = formatRupiah(avgCart);

    // 3. Render Table rows
    transactionTableBody.innerHTML = '';

    if (filteredTrx.length === 0) {
      transactionTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-light);">
            Tidak ada transaksi yang cocok dengan filter pencarian.
          </td>
        </tr>
      `;
      return;
    }

    filteredTrx.forEach((trx, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="text-align: center; font-weight: 500;">${formatDateDisplay(trx.date, trx.time)}</td>
        <td style="text-align: center; font-weight: 600;" class="prod-code-cell">${trx.id}</td>
        <td class="prod-name-cell">${trx.cashier}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-dark); padding-right: 1.5rem;">${formatRupiah(trx.total)}</td>
        <td style="text-align: center;">
          <button class="action-btn edit-btn detail-trigger" data-id="${trx.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Detail
          </button>
        </td>
      `;

      // Bind detail dialog trigger
      tr.querySelector('.detail-trigger').addEventListener('click', () => {
        openDetailModal(trx);
      });

      transactionTableBody.appendChild(tr);
    });
  }

  // Bind live filters
  searchQuery.addEventListener('input', renderTransactionsTable);
  startDate.addEventListener('change', renderTransactionsTable);
  endDate.addEventListener('change', renderTransactionsTable);

  // Reset Dates Filter
  resetDateBtn.addEventListener('click', () => {
    startDate.value = '';
    endDate.value = '';
    renderTransactionsTable();
  });

  // ==========================================================================
  // Modal Popup Control
  // ==========================================================================
  function openDetailModal(trx) {
    selectedTransaction = trx;

    detailTrxId.textContent = trx.id;
    detailDate.textContent = formatDateDisplay(trx.date, trx.time);
    detailCashier.textContent = trx.cashier;

    // Render invoice items
    detailItemsBody.innerHTML = '';
    trx.items.forEach(item => {
      const row = document.createElement('div');
      row.style.marginBottom = '0.5rem';
      
      const itemTotal = item.qty * item.price;
      row.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 0.15rem;">${item.name}</div>
        <div style="display: flex; justify-content: space-between;">
          <span>  ${item.qty} x ${formatRupiah(item.price).padEnd(12, ' ')}</span>
          <span>${formatRupiah(itemTotal)}</span>
        </div>
      `;
      detailItemsBody.appendChild(row);
    });

    detailSubtotal.textContent = formatRupiah(trx.subtotal);
    detailTax.textContent = formatRupiah(trx.tax);
    detailTotal.textContent = formatRupiah(trx.total);

    transactionDetailModal.classList.remove('hidden');
  }

  function closeDetailModal() {
    transactionDetailModal.classList.add('hidden');
    selectedTransaction = null;
  }

  // Close bindings
  closeDetailModalXBtn.addEventListener('click', closeDetailModal);
  closeDetailModalBtn.addEventListener('click', closeDetailModal);
  transactionDetailModal.addEventListener('click', (e) => {
    if (e.target === transactionDetailModal) {
      closeDetailModal();
    }
  });

  // Print simulation trigger
  printDetailBtn.addEventListener('click', () => {
    if (selectedTransaction) {
      alert(`Mencetak struk transaksi ${selectedTransaction.id} ke Printer Kasir Thermal...`);
    }
  });

  // ==========================================================================
  // Initial Table Render
  // ==========================================================================
  renderTransactionsTable();
});
