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
  // Product Database Default Initializer
  // ==========================================================================
  const DEFAULT_PRODUCTS = [
    { code: '8991001', name: 'Kopi Susu Gula Aren 250ml', price: 18000, category: 'Minuman', stock: 100 },
    { code: '8991002', name: 'Roti Tawar Gandum FreshMarket', price: 15000, category: 'Makanan', stock: 45 },
    { code: '8991003', name: 'Susu Cair UHT Full Cream 1L', price: 22000, category: 'Minuman', stock: 60 },
    { code: '8991004', name: 'Teh Hijau Jasmine Botol 450ml', price: 6000, category: 'Minuman', stock: 120 },
    { code: '8991005', name: 'Mie Instan Goreng Rasa Rendang', price: 3500, category: 'Makanan', stock: 250 },
    { code: '8991006', name: 'Minyak Goreng Sawit Refill 2L', price: 34000, category: 'Makanan', stock: 80 },
    { code: '8991007', name: 'Sabun Mandi Cair Lemon 400ml', price: 26000, category: 'Kebersihan', stock: 35 },
    { code: '8991008', name: 'Peralatan Makan Sendok Garpu Set', price: 12000, category: 'Lainnya', stock: 50 }
  ];

  // ==========================================================================
  // State Management
  // ==========================================================================
  let selectedProduct = null; // Stores target product object for stock adjustments

  function getProducts() {
    if (!localStorage.getItem('productsDb')) {
      localStorage.setItem('productsDb', JSON.stringify(DEFAULT_PRODUCTS));
    }
    return JSON.parse(localStorage.getItem('productsDb'));
  }

  function saveProducts(products) {
    localStorage.setItem('productsDb', JSON.stringify(products));
  }

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const adminName = document.getElementById('adminName');
  const liveClock = document.getElementById('liveClock');
  const logoutBtn = document.getElementById('logoutBtn');

  // Controls
  const searchQuery = document.getElementById('searchQuery');
  const stockTableBody = document.getElementById('stockTableBody');

  // Quick stats panels
  const statsHabis = document.getElementById('statsHabis');
  const statsMenipis = document.getElementById('statsMenipis');
  const statsAman = document.getElementById('statsAman');

  // Modal
  const adjustStockModal = document.getElementById('adjustStockModal');
  const targetProdName = document.getElementById('targetProdName');
  const currentStockDisplay = document.getElementById('currentStockDisplay');
  const adjustAction = document.getElementById('adjustAction');
  const adjustQty = document.getElementById('adjustQty');
  const adjustQtyLabel = document.getElementById('adjustQtyLabel');
  const adjustQtyError = document.getElementById('adjustQtyError');
  const adjustStockForm = document.getElementById('adjustStockForm');
  const closeModalXBtn = document.getElementById('closeModalXBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

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
  // Table & Stats Rendering
  // ==========================================================================
  function renderStockTable() {
    const products = getProducts();
    const query = searchQuery.value.trim().toLowerCase();

    // 1. Calculate overall statistics counts (independent of filter query)
    let countHabis = 0;
    let countMenipis = 0;
    let countAman = 0;

    products.forEach(p => {
      if (p.stock <= 0) {
        countHabis++;
      } else if (p.stock < 30) {
        countMenipis++;
      } else {
        countAman++;
      }
    });

    statsHabis.textContent = countHabis;
    statsMenipis.textContent = countMenipis;
    statsAman.textContent = countAman;

    // 2. Filter products based on search query
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(query) || p.code.includes(query)
    );

    // Clear previous rows
    stockTableBody.innerHTML = '';

    if (filteredProducts.length === 0) {
      stockTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
            Tidak ada produk yang cocok dengan pencarian stok.
          </td>
        </tr>
      `;
      return;
    }

    // Populate rows
    filteredProducts.forEach((p, index) => {
      const tr = document.createElement('tr');
      
      // Determine Stock Badge status & class
      let badgeClass = '';
      let statusText = '';
      if (p.stock <= 0) {
        badgeClass = 'badge-danger';
        statusText = 'Stok Habis';
      } else if (p.stock < 30) {
        badgeClass = 'badge-warning';
        statusText = 'Stok Menipis';
      } else {
        badgeClass = 'badge-safe';
        statusText = 'Stok Aman';
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="prod-code-cell">${p.code}</td>
        <td class="prod-name-cell">${p.name}</td>
        <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary-hover); padding: 0.2rem 0.6rem; border-radius: 6px;">${p.category}</span></td>
        <td style="text-align: center; font-weight: 700; color: var(--text-dark); font-size: 1.05rem;">${p.stock}</td>
        <td style="text-align: center;">
          <span class="badge ${badgeClass}">${statusText}</span>
        </td>
        <td style="text-align: center;">
          <button class="action-btn edit-btn adjust-trigger" data-code="${p.code}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Sesuaikan
          </button>
        </td>
      `;

      // Bind click trigger
      tr.querySelector('.adjust-trigger').addEventListener('click', () => {
        openAdjustModal(p);
      });

      stockTableBody.appendChild(tr);
    });
  }

  // Bind live search
  searchQuery.addEventListener('input', renderStockTable);

  // ==========================================================================
  // Modal Operations
  // ==========================================================================
  function openAdjustModal(product) {
    selectedProduct = product;
    
    // Fill displays
    targetProdName.value = product.name;
    currentStockDisplay.value = product.stock;
    
    // Reset fields
    adjustAction.value = 'ADD';
    adjustQty.value = '';
    adjustQtyLabel.textContent = 'Jumlah Tambahan';
    adjustQty.placeholder = 'Masukkan jumlah unit...';
    
    clearInputError();
    
    // Display modal
    adjustStockModal.classList.remove('hidden');
    adjustQty.focus();
  }

  function closeModal() {
    adjustStockModal.classList.add('hidden');
    selectedProduct = null;
  }

  function clearInputError() {
    adjustQtyError.classList.remove('visible');
    adjustQty.closest('.input-wrapper').classList.remove('error');
  }

  function showInputError(message) {
    adjustQtyError.textContent = message;
    adjustQtyError.classList.add('visible');
    adjustQty.closest('.input-wrapper').classList.add('error');
  }

  // Adjust Action dropdown event listener
  adjustAction.addEventListener('change', () => {
    const action = adjustAction.value;
    clearInputError();

    if (action === 'ADD') {
      adjustQtyLabel.textContent = 'Jumlah Tambahan';
      adjustQty.placeholder = 'Masukkan jumlah unit...';
    } else if (action === 'REDUCE') {
      adjustQtyLabel.textContent = 'Jumlah Pengurangan';
      adjustQty.placeholder = 'Masukkan jumlah unit...';
    } else if (action === 'SET') {
      adjustQtyLabel.textContent = 'Jumlah Stok Baru';
      adjustQty.placeholder = 'Masukkan nominal stok...';
    }
  });

  // Bind close buttons
  closeModalXBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  adjustQty.addEventListener('input', clearInputError);

  // Close modal on overlay click
  adjustStockModal.addEventListener('click', (e) => {
    if (e.target === adjustStockModal) {
      closeModal();
    }
  });

  // ==========================================================================
  // Form Submit Handler
  // ==========================================================================
  adjustStockForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const action = adjustAction.value;
    const qtyVal = parseInt(adjustQty.value, 10);

    // Validation
    if (isNaN(qtyVal) || qtyVal < 0) {
      showInputError('Jumlah harus berupa angka bulat positif');
      return;
    }

    const currentStock = selectedProduct.stock;
    let finalStock = currentStock;

    if (action === 'ADD') {
      finalStock = currentStock + qtyVal;
    } else if (action === 'REDUCE') {
      if (qtyVal > currentStock) {
        showInputError('Jumlah pengurangan melebihi stok yang tersedia!');
        return;
      }
      finalStock = currentStock - qtyVal;
    } else if (action === 'SET') {
      finalStock = qtyVal;
    }

    // Process save
    const products = getProducts();
    const index = products.findIndex(p => p.code === selectedProduct.code);
    
    if (index !== -1) {
      products[index].stock = finalStock;
      saveProducts(products);
    }

    closeModal();
    renderStockTable();
  });

  // ==========================================================================
  // Initial Table Render
  // ==========================================================================
  renderStockTable();
});
