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
  // Database Initializers
  // ==========================================================================
  const DEFAULT_CATEGORIES = ['Makanan', 'Minuman', 'Kebersihan', 'Lainnya'];
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
  let editCategoryName = null; // Stores category name when editing, null represents ADD mode

  function getCategories() {
    if (!localStorage.getItem('categoriesDb')) {
      localStorage.setItem('categoriesDb', JSON.stringify(DEFAULT_CATEGORIES));
    }
    return JSON.parse(localStorage.getItem('categoriesDb'));
  }

  function saveCategories(categories) {
    localStorage.setItem('categoriesDb', JSON.stringify(categories));
  }

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
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const categoryTableBody = document.getElementById('categoryTableBody');

  // Modal Dialog
  const categoryModal = document.getElementById('categoryModal');
  const modalTitle = document.getElementById('modalTitle');
  const categoryForm = document.getElementById('categoryForm');
  const closeModalXBtn = document.getElementById('closeModalXBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // Modal Inputs
  const catName = document.getElementById('catName');
  const catNameError = document.getElementById('catNameError');

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
  function renderCategoriesTable() {
    const categories = getCategories();
    const products = getProducts();

    // Clear previous rows
    categoryTableBody.innerHTML = '';

    categories.forEach((cat, index) => {
      // Calculate how many products are currently in this category
      const productCount = products.filter(p => p.category === cat).length;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="font-weight: 600; color: var(--text-dark);">${cat}</td>
        <td style="text-align: center; font-weight: 500;">${productCount} Produk</td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button class="action-btn edit-btn" data-name="${cat}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="action-btn delete-btn" data-name="${cat}" ${cat === 'Lainnya' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
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
        openEditModal(cat);
      });

      if (cat !== 'Lainnya') {
        tr.querySelector('.delete-btn').addEventListener('click', () => {
          deleteCategory(cat);
        });
      }

      categoryTableBody.appendChild(tr);
    });
  }

  // ==========================================================================
  // Modal Control
  // ==========================================================================
  function openAddModal() {
    editCategoryName = null;
    modalTitle.textContent = 'Tambah Kategori Baru';
    
    categoryForm.reset();
    clearInputError();
    
    categoryModal.classList.remove('hidden');
    catName.focus();
  }

  function openEditModal(category) {
    editCategoryName = category;
    modalTitle.textContent = 'Edit Kategori';
    
    catName.value = category;
    clearInputError();
    
    categoryModal.classList.remove('hidden');
    catName.focus();
  }

  function closeModal() {
    categoryModal.classList.add('hidden');
    editCategoryName = null;
  }

  function clearInputError() {
    catNameError.classList.remove('visible');
    catName.closest('.input-wrapper').classList.remove('error');
  }

  function showInputError(message) {
    catNameError.textContent = message;
    catNameError.classList.add('visible');
    catName.closest('.input-wrapper').classList.add('error');
  }

  openAddModalBtn.addEventListener('click', openAddModal);
  closeModalXBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close modal on overlay click
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      closeModal();
    }
  });

  catName.addEventListener('input', clearInputError);

  // ==========================================================================
  // Form Submission (Create & Update)
  // ==========================================================================
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameVal = catName.value.trim();

    // Validation
    if (!nameVal) {
      showInputError('Nama Kategori wajib diisi');
      return;
    }

    const categories = getCategories();

    // Check duplicate (case insensitive)
    const duplicateExists = categories.some(cat => 
      cat.toLowerCase() === nameVal.toLowerCase() && cat !== editCategoryName
    );

    if (duplicateExists) {
      showInputError('Nama Kategori tersebut sudah terdaftar!');
      return;
    }

    if (editCategoryName !== null) {
      // Edit Mode
      
      // Constraint: Cannot rename 'Lainnya' to maintain system default fallback
      if (editCategoryName === 'Lainnya' && nameVal !== 'Lainnya') {
        alert("Kategori default 'Lainnya' tidak dapat diubah namanya!");
        closeModal();
        return;
      }

      const index = categories.indexOf(editCategoryName);
      if (index !== -1) {
        categories[index] = nameVal;

        // Dynamic Cascade update products references
        const products = getProducts();
        products.forEach(p => {
          if (p.category === editCategoryName) {
            p.category = nameVal;
          }
        });
        saveProducts(products);
      }
    } else {
      // Add Mode
      categories.push(nameVal);
    }

    saveCategories(categories);
    closeModal();
    renderCategoriesTable();
  });

  // ==========================================================================
  // Delete Operation (Fallback to 'Lainnya')
  // ==========================================================================
  function deleteCategory(cat) {
    if (cat === 'Lainnya') {
      alert("Kategori default 'Lainnya' tidak dapat dihapus!");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus kategori '${cat}'? Produk yang tergabung dalam kategori ini akan otomatis dipindahkan ke kategori 'Lainnya'.`)) {
      const categories = getCategories();
      const updatedCategories = categories.filter(c => c !== cat);
      saveCategories(updatedCategories);

      // Cascade product references fallback to default 'Lainnya'
      const products = getProducts();
      products.forEach(p => {
        if (p.category === cat) {
          p.category = 'Lainnya';
        }
      });
      saveProducts(products);

      renderCategoriesTable();
    }
  }

  // ==========================================================================
  // Initial Table Render
  // ==========================================================================
  renderCategoriesTable();
});
