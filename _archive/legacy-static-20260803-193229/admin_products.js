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
  // Mock Product Database Default Initializer
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
  let editProductCode = null; // Stores code when editing, null represents ADD mode

  function getProducts() {
    if (!localStorage.getItem('productsDb')) {
      localStorage.setItem('productsDb', JSON.stringify(DEFAULT_PRODUCTS));
    }
    return JSON.parse(localStorage.getItem('productsDb'));
  }

  function saveProducts(products) {
    localStorage.setItem('productsDb', JSON.stringify(products));
  }

  const DEFAULT_CATEGORIES = ['Makanan', 'Minuman', 'Kebersihan', 'Lainnya'];

  function getCategories() {
    if (!localStorage.getItem('categoriesDb')) {
      localStorage.setItem('categoriesDb', JSON.stringify(DEFAULT_CATEGORIES));
    }
    return JSON.parse(localStorage.getItem('categoriesDb'));
  }

  function populateCategoryDropdowns() {
    const categories = getCategories();
    
    // Save current values to restore them after repopulating
    const selectedFilter = categoryFilter.value || 'ALL';
    const selectedProdCategory = prodCategory.value || 'Makanan';
    
    // Populate filter dropdown
    categoryFilter.innerHTML = '<option value="ALL">Semua Kategori</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
    categoryFilter.value = selectedFilter;

    // Populate form dropdown
    prodCategory.innerHTML = '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      prodCategory.appendChild(opt);
    });
    prodCategory.value = selectedProdCategory;
  }

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const adminName = document.getElementById('adminName');
  const liveClock = document.getElementById('liveClock');
  const logoutBtn = document.getElementById('logoutBtn');

  // Controls
  const searchQuery = document.getElementById('searchQuery');
  const categoryFilter = document.getElementById('categoryFilter');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

  // Table
  const productTableBody = document.getElementById('productTableBody');

  // Modal Dialog
  const productModal = document.getElementById('productModal');
  const modalTitle = document.getElementById('modalTitle');
  const productForm = document.getElementById('productForm');
  const closeModalXBtn = document.getElementById('closeModalXBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // Modal Inputs
  const prodBarcode = document.getElementById('prodBarcode');
  const prodName = document.getElementById('prodName');
  const prodCategory = document.getElementById('prodCategory');
  const prodPrice = document.getElementById('prodPrice');
  const prodStock = document.getElementById('prodStock');

  // Input Field Errors
  const barcodeError = document.getElementById('barcodeError');
  const nameError = document.getElementById('nameError');
  const priceError = document.getElementById('priceError');
  const stockError = document.getElementById('stockError');

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
  // Format Currency Helper
  // ==========================================================================
  function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  // ==========================================================================
  // Table Rendering
  // ==========================================================================
  function renderProductsTable() {
    const products = getProducts();
    const query = searchQuery.value.trim().toLowerCase();
    const catFilter = categoryFilter.value;

    // Filter logic
    const filteredProducts = products.filter(p => {
      const matchesCategory = (catFilter === 'ALL' || p.category === catFilter);
      const matchesSearch = (p.name.toLowerCase().includes(query) || p.code.includes(query));
      return matchesCategory && matchesSearch;
    });

    // Clear previous rows
    productTableBody.innerHTML = '';

    if (filteredProducts.length === 0) {
      productTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-light);">
            Tidak ada produk yang cocok dengan pencarian / filter kategori.
          </td>
        </tr>
      `;
      return;
    }

    // Populate rows
    filteredProducts.forEach((p, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="prod-code-cell">${p.code}</td>
        <td class="prod-name-cell">${p.name}</td>
        <td><span class="badge" style="background-color: var(--primary-light); color: var(--primary-hover); padding: 0.2rem 0.6rem; border-radius: 6px;">${p.category}</span></td>
        <td style="text-align: right; font-weight: 600;">${formatRupiah(p.price)}</td>
        <td style="text-align: center; font-weight: 600; color: ${p.stock < 10 ? 'var(--error-text)' : 'var(--text-dark)'};">${p.stock}</td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button class="action-btn edit-btn" data-code="${p.code}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="action-btn delete-btn" data-code="${p.code}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Hapus
            </button>
          </div>
        </td>
      `;

      // Bind events
      tr.querySelector('.edit-btn').addEventListener('click', () => {
        openEditModal(p);
      });

      tr.querySelector('.delete-btn').addEventListener('click', () => {
        deleteProduct(p);
      });

      productTableBody.appendChild(tr);
    });
  }

  // ==========================================================================
  // Filter & Search Triggers
  // ==========================================================================
  searchQuery.addEventListener('input', renderProductsTable);
  categoryFilter.addEventListener('change', renderProductsTable);

  // ==========================================================================
  // Modal Control
  // ==========================================================================
  function openAddModal() {
    editProductCode = null;
    modalTitle.textContent = 'Tambah Produk Baru';
    
    // Clear fields
    productForm.reset();
    prodBarcode.disabled = false;
    
    // Clear validation errors
    clearValidationErrors();
    
    // Show modal
    productModal.classList.remove('hidden');
  }

  function openEditModal(product) {
    editProductCode = product.code;
    modalTitle.textContent = 'Edit Detail Produk';
    
    // Fill fields
    prodBarcode.value = product.code;
    prodBarcode.disabled = true; // Barcode code is unique identifier
    prodName.value = product.name;
    prodCategory.value = product.category;
    prodPrice.value = product.price;
    prodStock.value = product.stock;
    
    // Clear validation errors
    clearValidationErrors();
    
    // Show modal
    productModal.classList.remove('hidden');
  }

  function closeModal() {
    productModal.classList.add('hidden');
    editProductCode = null;
  }

  function clearValidationErrors() {
    const errorSpans = [barcodeError, nameError, priceError, stockError];
    errorSpans.forEach(span => span.classList.remove('visible'));
    
    const inputWrappers = [
      prodBarcode.closest('.input-wrapper'),
      prodName.closest('.input-wrapper'),
      prodPrice.closest('.input-wrapper'),
      prodStock.closest('.input-wrapper')
    ];
    inputWrappers.forEach(wrap => wrap.classList.remove('error'));
  }

  // Bind modal open/close buttons
  openAddModalBtn.addEventListener('click', openAddModal);
  closeModalXBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close modal on overlay click
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      closeModal();
    }
  });

  // Clear errors on typing
  prodBarcode.addEventListener('input', () => clearInputError(prodBarcode, barcodeError));
  prodName.addEventListener('input', () => clearInputError(prodName, nameError));
  prodPrice.addEventListener('input', () => clearInputError(prodPrice, priceError));
  prodStock.addEventListener('input', () => clearInputError(prodStock, stockError));

  function clearInputError(inputEl, errorEl) {
    errorEl.classList.remove('visible');
    inputEl.closest('.input-wrapper').classList.remove('error');
  }

  function showInputError(inputEl, errorEl, message) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    inputEl.closest('.input-wrapper').classList.add('error');
  }

  // ==========================================================================
  // Form Submission (Create & Update)
  // ==========================================================================
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    
    const barcodeVal = prodBarcode.value.trim();
    const nameVal = prodName.value.trim();
    const catVal = prodCategory.value;
    const priceVal = parseInt(prodPrice.value, 10);
    const stockVal = parseInt(prodStock.value, 10);

    // Validate Barcode
    if (editProductCode === null) {
      if (!barcodeVal) {
        showInputError(prodBarcode, barcodeError, 'Kode Barcode wajib diisi');
        isValid = false;
      } else if (!/^[0-9]+$/.test(barcodeVal)) {
        showInputError(prodBarcode, barcodeError, 'Barcode harus berupa angka saja');
        isValid = false;
      } else {
        // Check uniqueness
        const products = getProducts();
        if (products.some(p => p.code === barcodeVal)) {
          showInputError(prodBarcode, barcodeError, 'Kode Barcode sudah terdaftar!');
          isValid = false;
        }
      }
    }

    // Validate Name
    if (!nameVal) {
      showInputError(prodName, nameError, 'Nama Produk wajib diisi');
      isValid = false;
    } else if (nameVal.length < 2) {
      showInputError(prodName, nameError, 'Nama Produk minimal 2 karakter');
      isValid = false;
    }

    // Validate Price
    if (isNaN(priceVal) || priceVal < 0) {
      showInputError(prodPrice, priceError, 'Harga harus berupa angka positif');
      isValid = false;
    }

    // Validate Stock
    if (isNaN(stockVal) || stockVal < 0) {
      showInputError(prodStock, stockError, 'Stok harus berupa angka positif');
      isValid = false;
    }

    if (!isValid) return;

    // Process save
    const products = getProducts();

    if (editProductCode !== null) {
      // Edit Mode
      const index = products.findIndex(p => p.code === editProductCode);
      if (index !== -1) {
        products[index].name = nameVal;
        products[index].category = catVal;
        products[index].price = priceVal;
        products[index].stock = stockVal;
      }
    } else {
      // Add Mode
      products.push({
        code: barcodeVal,
        name: nameVal,
        category: catVal,
        price: priceVal,
        stock: stockVal
      });
    }

    saveProducts(products);
    closeModal();
    renderProductsTable();
  });

  // ==========================================================================
  // Delete Operation
  // ==========================================================================
  function deleteProduct(product) {
    if (confirm(`Apakah Anda yakin ingin menghapus produk '${product.name}' (${product.code}) dari inventaris?`)) {
      const products = getProducts();
      const updated = products.filter(p => p.code !== product.code);
      
      saveProducts(updated);
      renderProductsTable();
    }
  }

  // ==========================================================================
  // Initial Table Render
  // ==========================================================================
  populateCategoryDropdowns();
  renderProductsTable();
});
