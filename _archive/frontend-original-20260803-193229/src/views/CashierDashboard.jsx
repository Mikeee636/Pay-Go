import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api';

function CashierDashboard() {
  const navigate = useNavigate();

  // Active cashier details
  const [cashierName, setCashierName] = useState('Kasir');
  const [cashierCode, setCashierCode] = useState('-');
  const [liveTime, setLiveTime] = useState('');

  // POS State
  const [productsDb, setProductsDb] = useState([]);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Cart
  const [cart, setCart] = useState([]);
  
  // Checkout
  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [cashInput, setCashInput] = useState('');
  
  // Modals
  const [checkoutResult, setCheckoutResult] = useState(null); // stores print receipt details

  // Refs
  const barcodeInputRef = useRef(null);
  const cashInputRef = useRef(null);

  // Authorization Check
  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');
    const code = localStorage.getItem('currentUserIdentifier');
    
    if (role !== 'Karyawan') {
      alert('Akses Ditolak! Halaman ini khusus untuk peran Karyawan/Kasir.');
      localStorage.clear();
      navigate('/');
      return;
    }
    
    setCashierName(name || 'Kasir');
    setCashierCode(code || '-');
  }, [navigate]);

  // Load products list from DB on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await request('/products');
        setProductsDb(data);
      } catch (err) {
        console.error('Gagal mengambil data produk:', err);
      }
    }
    fetchProducts();
  }, []);

  // Active Live Clock
  useEffect(() => {
    function tick() {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const now = new Date();
      
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      
      setLiveTime(`${dayName}, ${dateNum} ${monthName} ${year} | ${h}:${m}:${s}`);
    }
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, []);

  // Autocomplete Search Filter
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const matches = productsDb.filter(p => 
      p.name.toLowerCase().includes(q) || p.code.includes(q)
    );
    setSearchResults(matches);
  }, [searchQuery, productsDb]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleShortcuts = (e) => {
      // ESC: Clear Cart
      if (e.key === 'Escape') {
        e.preventDefault();
        if (window.confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) {
          setCart([]);
          setBarcodeQuery('');
          setSearchQuery('');
          setCashInput('');
          if (barcodeInputRef.current) barcodeInputRef.current.focus();
        }
      }
      // F8: Focus Cash Input
      if (e.key === 'F8') {
        e.preventDefault();
        if (cashInputRef.current) cashInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const formatRupiah = (num) => 'Rp ' + num.toLocaleString('id-ID');

  // Add Item to Cart (Autocomplete select or direct barcode scan)
  const addProductToCart = (product) => {
    if (product.stock <= 0) {
      alert(`Stok produk '${product.name}' habis!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.code === product.code);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty >= product.stock) {
        alert(`Jumlah kuantitas melebihi stok yang tersedia (${product.stock} unit)`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
    
    // Clear search and refocus barcode
    setBarcodeQuery('');
    setSearchQuery('');
    setSearchResults([]);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const q = barcodeQuery.trim();
    if (!q) return;

    // Search exact barcode
    const match = productsDb.find(p => p.code === q);
    if (match) {
      addProductToCart(match);
    } else {
      alert(`Barcode '${q}' tidak ditemukan!`);
    }
  };

  // Adjust cart quantities
  const updateItemQty = (code, delta) => {
    const idx = cart.findIndex(item => item.product.code === code);
    if (idx === -1) return;

    const newQty = cart[idx].qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product.code !== code));
    } else {
      const maxStock = cart[idx].product.stock;
      if (newQty > maxStock) {
        alert(`Jumlah kuantitas melebihi stok yang tersedia (${maxStock} unit)`);
        return;
      }
      const updated = [...cart];
      updated[idx].qty = newQty;
      setCart(updated);
    }
  };

  const removeCartItem = (code) => {
    setCart(cart.filter(item => item.product.code !== code));
  };

  // Cart financial summary
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const getTax = () => Math.round(getSubtotal() * 0.11);
  const getTotal = () => getSubtotal() + getTax();

  // Payment Change details
  const getCashPaid = () => {
    const num = parseInt(cashInput.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };
  const getChange = () => {
    const cash = getCashPaid();
    const total = getTotal();
    return cash >= total ? cash - total : 0;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const totalVal = getTotal();
    const cashPaidVal = getCashPaid();

    if (paymentMethod === 'TUNAI') {
      if (!cashInput) {
        alert('Mohon masukkan nominal uang yang diterima!');
        if (cashInputRef.current) cashInputRef.current.focus();
        return;
      }
      if (cashPaidVal < totalVal) {
        alert('Uang yang diterima kurang dari total belanja!');
        if (cashInputRef.current) cashInputRef.current.focus();
        return;
      }
    }

    try {
      const payload = {
        cashier: cashierName,
        subtotal: getSubtotal(),
        tax: getTax(),
        total: totalVal,
        items: cart.map(item => ({
          code: item.product.code,
          name: item.product.name,
          qty: item.qty,
          price: item.product.price
        }))
      };

      const data = await request('/checkout', {
        method: 'POST',
        body: payload
      });

      // Save checkout result to pop-up receipt modal
      setCheckoutResult({
        id: data.transaction.id,
        date: data.transaction.date,
        time: data.transaction.time,
        cashier: data.transaction.cashier,
        subtotal: data.transaction.subtotal,
        tax: data.transaction.tax,
        total: data.transaction.total,
        items: data.transaction.items,
        cashPaid: paymentMethod === 'TUNAI' ? cashPaidVal : 0,
        change: paymentMethod === 'TUNAI' ? (cashPaidVal - totalVal) : 0,
        method: paymentMethod
      });

      // Refresh products database to reflect updated stocks
      const refreshedProds = await request('/products');
      setProductsDb(refreshedProds);

    } catch (err) {
      alert(err.message || 'Gagal memproses transaksi.');
    }
  };

  const startNewTransaction = () => {
    setCart([]);
    setSearchQuery('');
    setCashInput('');
    setCheckoutResult(null);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Kasir POS?')) {
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="dashboard-body">
      
      <div className="dashboard-wrapper">
        
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
                <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" stroke-width="8" stroke-linecap="round" />
                <circle cx="50" cy="55" r="10" fill="#ffffff" />
                <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span className="logo-text">Pay <span className="logo-text-accent">&amp; Go</span></span>
            </div>
          </div>

          <div className="user-profile-card">
            <div className="user-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name" id="cashierName">{cashierName}</span>
              <span className="user-role">Nomor Karyawan: {cashierCode}</span>
            </div>
          </div>

          <nav class="sidebar-menu">
            <a href="#" className="menu-item active" onClick={(e) => e.preventDefault()}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
              Menu Transaksi
            </a>
            <div className="menu-divider"></div>
            <a href="#" className="menu-item logout" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Keluar
            </a>
          </nav>
        </aside>

        {/* Main POS Workspace */}
        <main className="dashboard-content">
          
          {/* Header */}
          <header className="topbar">
            <div className="topbar-left">
              <h1>Dashboard POS Kasir Mandiri</h1>
              <p className="subtitle">Lakukan pemindaian barcode produk dan kelola keranjang belanja mandiri</p>
            </div>
            <div className="topbar-right">
              <div className="time-tracker">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="time-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span id="liveClock">{liveTime}</span>
              </div>
            </div>
          </header>

          {/* POS Layout Panel Grid */}
          <div className="pos-desktop-layout">
            
            {/* Left side: Search & Cart Listing */}
            <div className="pos-left-side">
              
              {/* Barcode scan area */}
              <div className="search-section-card">
                <form onSubmit={handleBarcodeSubmit}>
                  <div className="input-group">
                    <label htmlFor="barcodeInput">Scan Barcode</label>
                    <div className="input-wrapper barcode-box-wrapper">
                      <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5v14"></path>
                        <path d="M8 5v14"></path>
                        <path d="M12 5v14"></path>
                        <path d="M17 5v14"></path>
                        <path d="M21 5v14"></path>
                      </svg>
                      <input 
                        type="text" 
                        id="barcodeInput" 
                        ref={barcodeInputRef}
                        placeholder="Scan barcode lalu tekan Enter..."
                        value={barcodeQuery}
                        onChange={(e) => setBarcodeQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <span className="scanner-tip">Cursor otomatis kembali ke kolom ini setelah item masuk.</span>
                  </div>
                </form>

                <div className="product-search-block">
                  <div className="input-group">
                    <label htmlFor="productSearchInput">Cari Produk Berdasarkan Nama atau Kode</label>
                    <div className="input-wrapper search-box-wrapper">
                      <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        id="productSearchInput"
                        placeholder="Ketik nama produk atau kode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Autocomplete suggestions dropdown overlay */}
                  {searchResults.length > 0 && (
                    <div className="autocomplete-results-panel">
                      {searchResults.map(p => (
                        <div 
                          key={p.code} 
                          className="autocomplete-row-item"
                          onClick={() => addProductToCart(p)}
                        >
                          <div className="row-left">
                            <span className="row-item-name">{p.name}</span>
                            <span className="row-item-code">Barcode: {p.code} | Stok: {p.stock}</span>
                          </div>
                          <div className="row-right">
                            <span className="row-item-price">{formatRupiah(p.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* POS Cart items table card */}
              <div className="cart-list-card">
                <div className="cart-list-header">
                  <h2>Keranjang Belanja Karyawan</h2>
                  <span className="cart-qty-badge">{cart.reduce((s,i) => s + i.qty, 0)} Item</span>
                </div>

                <div className="table-container">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>No</th>
                        <th>Nama Produk</th>
                        <th style={{ width: '130px' }}>Harga Satuan</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Kuantitas</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Total</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody id="cartTableBody">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-cart-state" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-light)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '1rem' }}>
                              <circle cx="9" cy="21" r="1"></circle>
                              <circle cx="20" cy="21" r="1"></circle>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <p>Keranjang kosong. Pindai barcode atau ketik nama barang di atas untuk menambahkan item.</p>
                          </td>
                        </tr>
                      ) : (
                        cart.map((item, index) => {
                          const itemTotal = item.product.price * item.qty;
                          return (
                            <tr key={item.product.code}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="cart-item-info">
                                  <span className="cart-item-name">{item.product.name}</span>
                                  <span className="cart-item-code">{item.product.code}</span>
                                </div>
                              </td>
                              <td>{formatRupiah(item.product.price)}</td>
                              <td>
                                <div className="qty-controls">
                                  <button type="button" className="qty-btn" onClick={() => updateItemQty(item.product.code, -1)}>-</button>
                                  <span className="qty-val">{item.qty}</span>
                                  <button type="button" className="qty-btn" onClick={() => updateItemQty(item.product.code, 1)}>+</button>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(itemTotal)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button type="button" className="delete-btn" onClick={() => removeCartItem(item.product.code)}>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ width: '14px', height: '14px' }}>
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right side: Payment Checkout details */}
            <div className="pos-right-side">
              
              <div className="checkout-summary-card">
                <h2>Total Pembayaran</h2>

                <div className="price-matrix">
                  <div className="matrix-row">
                    <span>Subtotal</span>
                    <span id="summarySubtotal">{formatRupiah(getSubtotal())}</span>
                  </div>
                  <div className="matrix-row">
                    <span>PPN (11%)</span>
                    <span id="summaryTax">{formatRupiah(getTax())}</span>
                  </div>
                  <div className="matrix-row grand-total-row">
                    <span>Grand Total</span>
                    <span id="summaryGrandTotal">{formatRupiah(getTotal())}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckoutSubmit}>
                  
                  {/* Payment Method Selector */}
                  <div className="input-group">
                    <label>Metode Pembayaran</label>
                    <div className="payment-options-grid">
                      <label className="payment-method-label">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="TUNAI" 
                          checked={paymentMethod === 'TUNAI'}
                          onChange={() => setPaymentMethod('TUNAI')}
                        />
                        <span className="method-box">TUNAI</span>
                      </label>
                      <label className="payment-method-label">
                        <input 
                          type="radio" 
                          name="paymentMethod" 
                          value="DEBIT" 
                          checked={paymentMethod === 'DEBIT'}
                          onChange={() => { setPaymentMethod('DEBIT'); setCashInput(''); }}
                        />
                        <span className="method-box">DEBIT / QRIS</span>
                      </label>
                    </div>
                  </div>

                  {/* Cash received details */}
                  {paymentMethod === 'TUNAI' && (
                    <div className="input-group" id="cashReceivedGroup">
                      <label htmlFor="cashReceived">Uang Diterima (F8)</label>
                      <div className="input-wrapper">
                        <span className="input-currency-prefix">Rp</span>
                        <input 
                          type="text" 
                          id="cashReceived" 
                          ref={cashInputRef}
                          placeholder="0"
                          value={cashInput}
                          onChange={(e) => setCashInput(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Changes calculations */}
                  {paymentMethod === 'TUNAI' && (
                    <div className="return-price-card" id="changeGroup">
                      <span>Uang Kembalian</span>
                      <h3 id="summaryChange">{formatRupiah(getChange())}</h3>
                    </div>
                  )}

                  {/* Keyboard Shortcuts Notice */}
                  <div className="keyboard-shortcuts-notice">
                    <span className="notice-title">Pintasan Keyboard</span>
                    <div className="shortcut-row"><span>[ESC]</span> <span>Batalkan Transaksi</span></div>
                    <div className="shortcut-row"><span>[F8]</span> <span>Nominal Bayar</span></div>
                  </div>

                  <button type="submit" className="checkout-btn" disabled={cart.length === 0}>
                    Bayar &amp; Cetak Struk
                  </button>

                </form>
              </div>

            </div>

          </div>

        </main>

      </div>

      {/* POS Monospace Thermal Receipt Modal popup */}
      {checkoutResult && (
        <div className="modal-overlay" id="receiptModal" style={{ display: 'flex' }}>
          <div className="receipt-modal-container scale-up">
            
            <div className="receipt-paper">
              
              {/* Receipt Header */}
              <div className="receipt-header">
                {/* SVG Logo variant */}
                <svg className="receipt-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
                  <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" stroke-width="8" stroke-linecap="round" />
                  <circle cx="50" cy="55" r="10" fill="#ffffff" />
                  <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <h3>PAY &amp; GO</h3>
                <p>FreshMarket Supermarket</p>
                <p>Jl. Jenderal Sudirman No. 45, Jakarta</p>
              </div>

              {/* Receipt Meta */}
              <div className="receipt-meta">
                <div className="meta-row"><span>No Invoice:</span> <span id="receiptNumber">{checkoutResult.id}</span></div>
                <div className="meta-row"><span>Tanggal:</span> <span id="receiptDate">{checkoutResult.date} {checkoutResult.time}</span></div>
                <div className="meta-row"><span>Kasir:</span> <span id="receiptCashier">{checkoutResult.cashier}</span></div>
                <div className="meta-row"><span>Metode:</span> <span id="receiptMethod">{checkoutResult.method}</span></div>
              </div>

              <div className="receipt-divider"></div>

              {/* Items listing */}
              <div className="receipt-items-body" id="receiptItemsBody">
                {checkoutResult.items.map(item => (
                  <div key={item.name} className="receipt-item-row">
                    <span className="item-name">{item.name}</span>
                    <div className="item-calc-row">
                      <span>{item.qty} x {formatRupiah(item.price)}</span>
                      <span>{formatRupiah(item.qty * item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="receipt-divider"></div>

              {/* Financial rekap totals */}
              <div className="receipt-totals">
                <div className="totals-row"><span>Subtotal:</span> <span id="receiptSubtotal">{formatRupiah(checkoutResult.subtotal)}</span></div>
                <div className="totals-row"><span>PPN (11%):</span> <span id="receiptTax">{formatRupiah(checkoutResult.tax)}</span></div>
                <div className="totals-row grand-total-row"><span>TOTAL BELANJA:</span> <span id="receiptGrandTotal">{formatRupiah(checkoutResult.total)}</span></div>
                
                {checkoutResult.method === 'TUNAI' && (
                  <>
                    <div className="totals-row" id="receiptCashRow"><span>Uang Diterima:</span> <span id="receiptCashPaid">{formatRupiah(checkoutResult.cashPaid)}</span></div>
                    <div className="totals-row" id="receiptChangeRow"><span>Kembalian:</span> <span id="receiptChange">{formatRupiah(checkoutResult.change)}</span></div>
                  </>
                )}
              </div>

              <div className="receipt-divider"></div>

              {/* Barcode details */}
              <div className="receipt-barcode">
                <svg className="receipt-barcode-svg" viewBox="0 0 100 40">
                  <g fill="#000000">
                    <rect x="10" y="5" width="2" height="25" />
                    <rect x="14" y="5" width="4" height="25" />
                    <rect x="20" y="5" width="1" height="25" />
                    <rect x="23" y="5" width="3" height="25" />
                    <rect x="28" y="5" width="2" height="25" />
                    <rect x="32" y="5" width="4" height="25" />
                    <rect x="38" y="5" width="1" height="25" />
                    <rect x="41" y="5" width="3" height="25" />
                    <rect x="46" y="5" width="2" height="25" />
                    <rect x="50" y="5" width="4" height="25" />
                    <rect x="56" y="5" width="1" height="25" />
                    <rect x="59" y="5" width="3" height="25" />
                    <rect x="64" y="5" width="2" height="25" />
                    <rect x="68" y="5" width="4" height="25" />
                    <rect x="74" y="5" width="1" height="25" />
                    <rect x="77" y="5" width="3" height="25" />
                    <rect x="82" y="5" width="2" height="25" />
                    <rect x="86" y="5" width="4" height="25" />
                  </g>
                  <text x="50" y="38" textAnchor="middle" fontSize="5" fontFamily="monospace">{checkoutResult.id}</text>
                </svg>
              </div>

              <div className="receipt-footer">
                <p>Terima Kasih atas Kunjungan Anda</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar</p>
              </div>

            </div>

            {/* Actions */}
            <div className="receipt-actions">
              <button type="button" className="receipt-action-btn print-btn" onClick={handlePrintReceipt}>Cetak Struk</button>
              <button type="button" className="receipt-action-btn new-trx-btn" onClick={startNewTransaction}>Transaksi Baru</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CashierDashboard;
