document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // Mock Product Database (initialized in localStorage to sync with Admin CRUD)
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

  if (!localStorage.getItem('productsDb')) {
    localStorage.setItem('productsDb', JSON.stringify(DEFAULT_PRODUCTS));
  }

  function getProductsDatabase() {
    return JSON.parse(localStorage.getItem('productsDb')) || DEFAULT_PRODUCTS;
  }

  // ==========================================================================
  // State Variables
  // ==========================================================================
  let cart = [];
  let currentTransactionNumber = '';

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const liveClock = document.getElementById('liveClock');
  
  // Inputs
  const barcodeInput = document.getElementById('barcodeInput');
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  
  // Cart
  const cartBody = document.getElementById('cartBody');
  const emptyCartRow = document.getElementById('emptyCartRow');
  const itemCount = document.getElementById('itemCount');
  
  // Checkout & Totals
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const taxDisplay = document.getElementById('taxDisplay');
  const grandTotalDisplay = document.getElementById('grandTotalDisplay');
  
  // Payments
  const paymentMethods = document.getElementsByName('paymentMethod');
  const cashFields = document.getElementById('cashFields');
  const cashInput = document.getElementById('cashInput');
  const changeDisplay = document.getElementById('changeDisplay');
  const quickCashButtons = document.querySelectorAll('.quick-cash-btn');
  
  // Buttons
  const payBtn = document.getElementById('payBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  // Receipt Modal
  const receiptModal = document.getElementById('receiptModal');
  const receiptNumber = document.getElementById('receiptNumber');
  const receiptDate = document.getElementById('receiptDate');
  const receiptItemsBody = document.getElementById('receiptItemsBody');
  const receiptSubtotal = document.getElementById('receiptSubtotal');
  const receiptTax = document.getElementById('receiptTax');
  const receiptGrandTotal = document.getElementById('receiptGrandTotal');
  const receiptMethod = document.getElementById('receiptMethod');
  const receiptCashRow = document.getElementById('receiptCashRow');
  const receiptCashPaid = document.getElementById('receiptCashPaid');
  const receiptChangeRow = document.getElementById('receiptChangeRow');
  const receiptChange = document.getElementById('receiptChange');
  const printReceiptBtn = document.getElementById('printReceiptBtn');
  const newTransBtn = document.getElementById('newTransBtn');

  // ==========================================================================
  // Clock and Focus Initialization
  // ==========================================================================
  
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

  // Focus barcode input
  function focusBarcode() {
    barcodeInput.focus();
  }
  
  // Auto focus on load
  focusBarcode();
  
  // Refocus barcode on clicking whitespace of dashboard content
  document.querySelector('.dashboard-content').addEventListener('click', (e) => {
    // Avoid stealing focus when user wants to search or edit inputs
    if (e.target.closest('#searchInput') || e.target.closest('.qty-control') || e.target.closest('#cashInput')) {
      return;
    }
    focusBarcode();
  });

  // ==========================================================================
  // Web Audio Synth Barcode Beep
  // ==========================================================================
  function playScanSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1100; // High pitch beep
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Soft volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08); // Quick fade
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.log('AudioContext not allowed or supported on this device.');
    }
  }

  // ==========================================================================
  // Helper Format Currency
  // ==========================================================================
  function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
  }

  function parseNumber(str) {
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  // ==========================================================================
  // Barcode Input Handler
  // ==========================================================================
  barcodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.value.trim();
      
      if (code) {
        const product = getProductsDatabase().find(p => p.code === code);
        if (product) {
          addToCart(product);
        } else {
          alert(`Produk dengan barcode '${code}' tidak ditemukan!`);
        }
        barcodeInput.value = '';
      }
      focusBarcode();
    }
  });

  // ==========================================================================
  // Product Search & Suggestions Autocomplete
  // ==========================================================================
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
      hideSuggestions();
      return;
    }
    
    // Filter database
    const matches = getProductsDatabase().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.code.includes(query)
    );
    
    if (matches.length > 0) {
      renderSuggestions(matches);
    } else {
      hideSuggestions();
    }
  });

  function renderSuggestions(products) {
    searchSuggestions.innerHTML = '';
    products.forEach(p => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = `
        <div>
          <span class="sugg-name">${p.name}</span>
          <span class="sugg-code">(${p.code})</span>
        </div>
        <span class="sugg-price">${formatRupiah(p.price)}</span>
      `;
      div.addEventListener('click', () => {
        addToCart(p);
        searchInput.value = '';
        hideSuggestions();
        focusBarcode();
      });
      searchSuggestions.appendChild(div);
    });
    searchSuggestions.classList.remove('hidden');
  }

  function hideSuggestions() {
    searchSuggestions.classList.add('hidden');
  }

  // Close suggestions if user clicks outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-area')) {
      hideSuggestions();
    }
  });

  // ==========================================================================
  // Shopping Cart & Table Management
  // ==========================================================================
  function addToCart(product) {
    const existing = cart.find(item => item.product.code === product.code);
    
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        product: product,
        qty: 1
      });
    }
    
    playScanSound();
    renderCart();
  }

  function removeFromCart(code) {
    cart = cart.filter(item => item.product.code !== code);
    renderCart();
    focusBarcode();
  }

  function updateQty(code, qty) {
    const item = cart.find(item => item.product.code === code);
    if (item) {
      item.qty = Math.max(1, qty);
      renderCart();
    }
  }

  function getCartSummary() {
    let subtotal = 0;
    cart.forEach(item => {
      subtotal += item.product.price * item.qty;
    });
    const tax = Math.round(subtotal * 0.11);
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }

  function renderCart() {
    // Clear rows except empty placeholder
    const rows = cartBody.querySelectorAll('tr:not(#emptyCartRow)');
    rows.forEach(r => r.remove());
    
    if (cart.length === 0) {
      emptyCartRow.classList.remove('hidden');
      itemCount.textContent = '0 Item';
      updateCheckoutPanel(0, 0, 0);
      return;
    }
    
    emptyCartRow.classList.add('hidden');
    
    // Populate items
    cart.forEach((item, index) => {
      const tr = document.createElement('tr');
      const itemTotal = item.product.price * item.qty;
      
      tr.innerHTML = `
        <td style="font-weight: 500;">${index + 1}</td>
        <td class="prod-name-cell">${item.product.name}</td>
        <td class="prod-code-cell">${item.product.code}</td>
        <td style="text-align: right;">${formatRupiah(item.product.price)}</td>
        <td style="text-align: center;">
          <div class="qty-control">
            <button type="button" class="qty-btn dec-btn" data-code="${item.product.code}">-</button>
            <input type="text" class="qty-val" value="${item.qty}" data-code="${item.product.code}">
            <button type="button" class="qty-btn inc-btn" data-code="${item.product.code}">+</button>
          </div>
        </td>
        <td style="text-align: right; font-weight: 600; color: var(--text-dark);">
          ${formatRupiah(itemTotal)}
        </td>
        <td style="text-align: center;">
          <button type="button" class="delete-row-btn" data-code="${item.product.code}" aria-label="Hapus produk">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </td>
      `;
      
      // Bind Events
      tr.querySelector('.dec-btn').addEventListener('click', () => {
        updateQty(item.product.code, item.qty - 1);
      });
      
      tr.querySelector('.inc-btn').addEventListener('click', () => {
        updateQty(item.product.code, item.qty + 1);
      });
      
      const qtyInput = tr.querySelector('.qty-val');
      qtyInput.addEventListener('change', () => {
        const val = parseNumber(qtyInput.value);
        updateQty(item.product.code, val);
      });
      
      qtyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          qtyInput.blur();
        }
      });
      
      tr.querySelector('.delete-row-btn').addEventListener('click', () => {
        removeFromCart(item.product.code);
      });
      
      cartBody.appendChild(tr);
    });
    
    // Set item count text
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    itemCount.textContent = `${totalItems} Item`;
    
    // Update panel prices
    const summary = getCartSummary();
    updateCheckoutPanel(summary.subtotal, summary.tax, summary.total);
  }

  // ==========================================================================
  // Checkout Summary Panel Management
  // ==========================================================================
  function updateCheckoutPanel(subtotal, tax, total) {
    subtotalDisplay.textContent = formatRupiah(subtotal);
    taxDisplay.textContent = formatRupiah(tax);
    grandTotalDisplay.textContent = formatRupiah(total);
    
    // Disable/Enable action buttons
    const isCartEmpty = cart.length === 0;
    payBtn.disabled = isCartEmpty;
    cancelBtn.disabled = isCartEmpty;
    
    // Recalculate cash return
    calculateChange();
  }

  // Payment method toggles
  paymentMethods.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === 'TUNAI') {
        cashFields.classList.remove('hidden');
      } else {
        cashFields.classList.add('hidden');
        cashInput.value = '';
        changeDisplay.textContent = formatRupiah(0);
      }
    });
  });

  // Calculate change
  function calculateChange() {
    const summary = getCartSummary();
    const rawCash = cashInput.value;
    
    if (!rawCash) {
      changeDisplay.textContent = formatRupiah(0);
      changeDisplay.style.color = '';
      return;
    }
    
    const cashValue = parseNumber(rawCash);
    const returnVal = cashValue - summary.total;
    
    if (returnVal < 0) {
      changeDisplay.textContent = 'Kurang ' + formatRupiah(Math.abs(returnVal));
      changeDisplay.style.color = 'var(--error-text)';
    } else {
      changeDisplay.textContent = formatRupiah(returnVal);
      changeDisplay.style.color = 'var(--primary-color)';
    }
  }

  cashInput.addEventListener('input', () => {
    // Format input as digits only
    const raw = cashInput.value;
    const cleanDigits = raw.replace(/[^0-9]/g, '');
    
    if (cleanDigits) {
      cashInput.value = parseInt(cleanDigits, 10).toLocaleString('id-ID');
    } else {
      cashInput.value = '';
    }
    calculateChange();
  });

  // Quick cash buttons
  quickCashButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const summary = getCartSummary();
      const val = btn.getAttribute('data-value');
      
      if (val === 'pas') {
        cashInput.value = summary.total.toLocaleString('id-ID');
      } else {
        const cashValue = parseInt(val, 10);
        cashInput.value = cashValue.toLocaleString('id-ID');
      }
      
      calculateChange();
      focusBarcode();
    });
  });

  // Cancel transaction
  cancelBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin membatalkan transaksi belanja ini?')) {
      cart = [];
      cashInput.value = '';
      renderCart();
      focusBarcode();
    }
  });

  // ==========================================================================
  // Receipt Generator & Settlement
  // ==========================================================================
  
  // Format leading zero helper
  const leadZero = (num) => String(num).padStart(2, '0');

  // Trigger Payment Click
  payBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    
    const summary = getCartSummary();
    
    // Verify cash paid is enough if Payment Method is Cash
    const activeMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    let cashPaidVal = 0;
    let changeVal = 0;
    
    if (activeMethod === 'TUNAI') {
      const cashText = cashInput.value;
      if (!cashText) {
        alert('Mohon masukkan nominal uang yang diterima!');
        cashInput.focus();
        return;
      }
      
      cashPaidVal = parseNumber(cashText);
      if (cashPaidVal < summary.total) {
        alert('Uang yang diterima kurang dari total belanja!');
        cashInput.focus();
        return;
      }
      changeVal = cashPaidVal - summary.total;
    }

    // Generate Transaction Number ID
    const d = new Date();
    const dateStr = `${d.getFullYear()}${leadZero(d.getMonth() + 1)}${leadZero(d.getDate())}`;
    const randomTrx = String(Math.floor(1000 + Math.random() * 9000));
    currentTransactionNumber = `TRX-${dateStr}-${randomTrx}`;
    
    // Populating receipt information
    receiptNumber.textContent = currentTransactionNumber;
    
    // Receipt date
    const dateFormatted = `${leadZero(d.getDate())}/${leadZero(d.getMonth() + 1)}/${d.getFullYear()} ${leadZero(d.getHours())}:${leadZero(d.getMinutes())}`;
    receiptDate.textContent = dateFormatted;
    
    // Cashier
    const activeCashierName = document.getElementById('cashierName').textContent;
    receiptCashier.textContent = activeCashierName;
    
    // Method
    receiptMethod.textContent = activeMethod;
    
    // Cash & Return details formatting
    if (activeMethod === 'TUNAI') {
      receiptCashRow.classList.remove('hidden');
      receiptChangeRow.classList.remove('hidden');
      receiptCashPaid.textContent = formatRupiah(cashPaidVal);
      receiptChange.textContent = formatRupiah(changeVal);
    } else {
      receiptCashRow.classList.add('hidden');
      receiptChangeRow.classList.add('hidden');
    }
    
    // Subtotal and Totals
    receiptSubtotal.textContent = formatRupiah(summary.subtotal);
    receiptTax.textContent = formatRupiah(summary.tax);
    receiptGrandTotal.textContent = formatRupiah(summary.total);

    // Items list
    receiptItemsBody.innerHTML = '';
    cart.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'receipt-item-row';
      
      const itemTotal = item.product.price * item.qty;
      itemRow.innerHTML = `
        <span class="item-name">${item.product.name}</span>
        <div class="item-calc-row">
          <span>${item.qty} x ${formatRupiah(item.product.price)}</span>
          <span>${formatRupiah(itemTotal)}</span>
        </div>
      `;
      receiptItemsBody.appendChild(itemRow);
    });

    // Save transaction to transactionsDb in localStorage for Admin report
    const DEFAULT_TRANSACTIONS = [
      { id: 'TRX-20260803-8712', date: '2026-08-03', time: '16:04', cashier: 'Budi Santoso', subtotal: 65765, tax: 7235, total: 73000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 2, price: 18000 }, { name: 'Minyak Goreng Sawit Refill 2L', qty: 1, price: 34000 }] },
      { id: 'TRX-20260803-1254', date: '2026-08-03', time: '15:52', cashier: 'Budi Santoso', subtotal: 16216, tax: 1784, total: 18000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 1, price: 18000 }] },
      { id: 'TRX-20260803-3498', date: '2026-08-03', time: '15:40', cashier: 'Siti Aminah', subtotal: 112162, tax: 12338, total: 124500, items: [{ name: 'Roti Tawar Gandum FreshMarket', qty: 2, price: 15000 }, { name: 'Susu Cair UHT Full Cream 1L', qty: 3, price: 22000 }] },
      { id: 'TRX-20260803-6231', date: '2026-08-03', time: '15:15', cashier: 'Ahmad Hidayat', subtotal: 37838, tax: 4162, total: 42000, items: [{ name: 'Susu Cair UHT Full Cream 1L', qty: 1, price: 22000 }, { name: 'Teh Hijau Jasmine Botol 450ml', qty: 3, price: 6000 }] },
      { id: 'TRX-20260803-9021', date: '2026-08-03', time: '14:50', cashier: 'Siti Aminah', subtotal: 230630, tax: 25370, total: 256000, items: [{ name: 'Minyak Goreng Sawit Refill 2L', qty: 5, price: 34000 }, { name: 'Sabun Mandi Cair Lemon 400ml', qty: 3, price: 26000 }] }
    ];

    const transactions = JSON.parse(localStorage.getItem('transactionsDb')) || DEFAULT_TRANSACTIONS;
    const isoDateStr = `${d.getFullYear()}-${leadZero(d.getMonth() + 1)}-${leadZero(d.getDate())}`;

    transactions.unshift({
      id: currentTransactionNumber,
      date: isoDateStr,
      time: `${leadZero(d.getHours())}:${leadZero(d.getMinutes())}`,
      cashier: activeCashierName,
      subtotal: summary.subtotal,
      tax: summary.tax,
      total: summary.total,
      items: cart.map(item => ({
        name: item.product.name,
        qty: item.qty,
        price: item.product.price
      }))
    });
    localStorage.setItem('transactionsDb', JSON.stringify(transactions));

    // Reduce product stock in productsDb dynamically
    const products = JSON.parse(localStorage.getItem('productsDb'));
    if (products) {
      cart.forEach(item => {
        const prod = products.find(p => p.code === item.product.code);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.qty);
        }
      });
      localStorage.setItem('productsDb', JSON.stringify(products));
    }

    // Update Simulated Barcode Label inside receipt SVG
    const textNode = receiptModal.querySelector('.receipt-barcode-svg text');
    if (textNode) {
      textNode.textContent = currentTransactionNumber;
    }
    
    // Play Success transaction beep sound
    playScanSound();
    setTimeout(playScanSound, 150);
    
    // Display Modal
    receiptModal.classList.remove('hidden');
  });

  // Print Receipt Button (Simulates print dialog)
  printReceiptBtn.addEventListener('click', () => {
    window.print();
  });

  // Start New Transaction (Close modal & clear cart)
  newTransBtn.addEventListener('click', () => {
    // Clear cart
    cart = [];
    cashInput.value = '';
    renderCart();
    
    // Close modal
    receiptModal.classList.add('hidden');
    
    // Refocus barcode
    focusBarcode();
  });
});
