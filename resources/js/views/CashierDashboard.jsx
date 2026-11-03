import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import BarcodeSvg from '../components/BarcodeSvg';

function CashierDashboard() {
  const navigate = useNavigate();

  // Active cashier details
  const [cashierName, setCashierName] = useState('Cashier');
  const [cashierCode, setCashierCode] = useState('-');
  const [liveTime, setLiveTime] = useState('');

  // POS State
  const [productsDb, setProductsDb] = useState([]);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showBarcodeCatalogModal, setShowBarcodeCatalogModal] = useState(false);

  // Custom Modal Dialog State
  const [dialogConfig, setDialogConfig] = useState(null);

  const showCustomAlert = (message, title = 'Notice') => {
    setDialogConfig({
      type: 'alert',
      title,
      message,
      onConfirm: () => setDialogConfig(null)
    });
  };

  const showCustomConfirm = (message, onConfirm, title = 'Confirmation', isDestructive = false) => {
    setDialogConfig({
      type: 'confirm',
      title,
      message,
      isDestructive,
      onConfirm: () => {
        setDialogConfig(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => setDialogConfig(null)
    });
  };

  // Cart (Persisted in localStorage across page reloads)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('payngo_cashier_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Payment & Checkout State (Persisted)
  const [paymentMethod, setPaymentMethod] = useState(() => {
    return localStorage.getItem('payngo_cashier_payment_method') || 'TUNAI';
  });
  const [cashInput, setCashInput] = useState(() => {
    return localStorage.getItem('payngo_cashier_cash_input') || '';
  });
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('payngo_admin_sidebar_collapsed') === 'true';
  });
  const [todayTrxCount, setTodayTrxCount] = useState(() => {
    const saved = localStorage.getItem('payngo_cashier_today_trx_count');
    return saved ? parseInt(saved, 10) : 12;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    return localStorage.getItem('payngo_cashier_drawer_open') === 'true';
  });

  const handleToggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Sync states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('payngo_cashier_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('payngo_cashier_payment_method', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    localStorage.setItem('payngo_cashier_cash_input', cashInput);
  }, [cashInput]);

  useEffect(() => {
    localStorage.setItem('payngo_admin_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('payngo_cashier_today_trx_count', todayTrxCount.toString());
  }, [todayTrxCount]);

  useEffect(() => {
    localStorage.setItem('payngo_cashier_drawer_open', isDrawerOpen.toString());
  }, [isDrawerOpen]);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedFlash, setScannedFlash] = useState(false);
  const [scannerError, setScannerError] = useState(null);

  // Refs
  const barcodeInputRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const scanCooldownRef = useRef(false);
  const productsDbRef = useRef([]);

  // Authorization Check
  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');
    const code = localStorage.getItem('currentUserIdentifier');

    if (role !== 'Karyawan') {
      showCustomAlert('Access Denied! This page is restricted to Employee/Cashier role.', 'Access Denied');
      localStorage.clear();
      navigate('/');
      return;
    }

    setCashierName(name || 'Cashier');
    setCashierCode(code || '-');
  }, [navigate]);

  // Load products list from DB on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await request('/products');
        setProductsDb(data);
        productsDbRef.current = data;
      } catch (err) {
        console.error('Failed to fetch products data:', err);
      }
    }
    fetchProducts();
  }, []);

  // Sync productsDb state with ref to avoid stale closure in camera scan callback
  useEffect(() => {
    productsDbRef.current = productsDb;
  }, [productsDb]);

  // Initialize Html5Qrcode for Laptop Front Webcam (facingMode: "user")
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      const readerElem = document.getElementById("reader");
      if (!readerElem) return;
      readerElem.innerHTML = "";

      function onScanSuccess(decodedText) {
        if (scanCooldownRef.current) return;

        scanCooldownRef.current = true;
        setScannedFlash(true);
        setTimeout(() => setScannedFlash(false), 500);
        setTimeout(() => { scanCooldownRef.current = false; }, 800);

        const cleanDecoded = String(decodedText).trim();
        const lowerDecoded = cleanDecoded.toLowerCase();
        const digitsDecoded = lowerDecoded.replace(/[^\d]/g, '');

        const match = productsDbRef.current.find(p => {
          const codeStr = String(p.code).trim();
          const lowerCode = codeStr.toLowerCase();
          const digitsCode = lowerCode.replace(/[^\d]/g, '');
          const idStr = String(p.id).trim().toLowerCase();
          const nameStr = p.name.toLowerCase();

          return (
            lowerCode === lowerDecoded ||
            idStr === lowerDecoded ||
            nameStr === lowerDecoded ||
            lowerDecoded.includes(lowerCode) ||
            (digitsCode.length >= 2 && digitsDecoded.includes(digitsCode)) ||
            (digitsDecoded.length >= 2 && digitsCode.includes(digitsDecoded))
          );
        });

        if (match) {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.18);
          } catch (e) { }

          addProductToCart(match);
        } else {
          showCustomAlert(`Barcode/QR '${decodedText}' berhasil ter-scan oleh kamera, namun kode tersebut tidak cocok dengan data produk di database!`, 'QR Code Terdeteksi');
        }
      }

      try {
        setScannerError(null);
        const html5QrCode = new Html5Qrcode("reader");
        html5QrcodeRef.current = html5QrCode;

        const config = {
          fps: 20,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // FORCE LAPTOP FRONT WEBCAM (facingMode: "user")
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          onScanSuccess,
          () => {}
        );

        if (isMounted) setIsCameraActive(true);
      } catch (err) {
        console.warn("User webcam start failed, trying default constraint:", err);
        try {
          if (html5QrcodeRef.current) {
            await html5QrcodeRef.current.start(
              true,
              { fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
              onScanSuccess,
              () => {}
            );
            if (isMounted) setIsCameraActive(true);
          }
        } catch (err2) {
          console.error("Camera start failed entirely:", err2);
          if (isMounted) {
            setScannerError("Gagal mengakses kamera webcam laptop. Mohon berikan izin kamera pada browser.");
            setIsCameraActive(false);
          }
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch(() => {}).finally(() => {
            try { html5QrcodeRef.current.clear(); } catch(e) {}
            html5QrcodeRef.current = null;
          });
        } catch (e) {}
      }
    };
  }, []);

  const stopCamera = async () => {
    if (!html5QrcodeRef.current) return;
    try {
      html5QrcodeRef.current.clear();
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    } finally {
      html5QrcodeRef.current = null;
      setIsCameraActive(false);
    }
  };

  // Active Live Clock (English Format)
  useEffect(() => {
    function tick() {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

  // Autocomplete Search Filter (Prefix priority: code/name starting with query first)
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const matches = productsDb.filter(p => {
      const nameLower = p.name.toLowerCase();
      const codeLower = String(p.code).trim().toLowerCase();
      const idStr = String(p.id).trim().toLowerCase();
      return nameLower.includes(q) || codeLower.includes(q) || idStr.includes(q);
    });

    // Sort: Prefix matches (starting with q) first, then position order, then alphabetical
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aCode = String(a.code).trim().toLowerCase();
      const bCode = String(b.code).trim().toLowerCase();

      const aCodeStarts = aCode.startsWith(q);
      const bCodeStarts = bCode.startsWith(q);
      const aNameStarts = aName.startsWith(q);
      const bNameStarts = bName.startsWith(q);

      // 1. Code starts with q
      if (aCodeStarts && !bCodeStarts) return -1;
      if (!aCodeStarts && bCodeStarts) return 1;

      // 2. Name starts with q
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      // 3. Position of q in code
      const aCodeIdx = aCode.indexOf(q);
      const bCodeIdx = bCode.indexOf(q);
      if (aCodeIdx !== bCodeIdx && aCodeIdx !== -1 && bCodeIdx !== -1) {
        return aCodeIdx - bCodeIdx;
      }

      // 4. Position of q in name
      const aNameIdx = aName.indexOf(q);
      const bNameIdx = bName.indexOf(q);
      if (aNameIdx !== bNameIdx && aNameIdx !== -1 && bNameIdx !== -1) {
        return aNameIdx - bNameIdx;
      }

      return aName.localeCompare(bName);
    });

    setSearchResults(matches);
  }, [searchQuery, productsDb]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleShortcuts = (e) => {
      // ESC: Clear Cart
      if (e.key === 'Escape') {
        e.preventDefault();
        showCustomConfirm(
          'Are you sure you want to cancel this transaction?',
          () => {
            setCart([]);
            setCashInput('');
            setBarcodeQuery('');
            setSearchQuery('');
            localStorage.removeItem('payngo_cashier_cart');
            localStorage.removeItem('payngo_cashier_cash_input');
            if (barcodeInputRef.current) barcodeInputRef.current.focus();
          },
          'Cancel Transaction',
          true
        );
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  const formatRupiah = (num) => 'Rp ' + (num || 0).toLocaleString('id-ID');
  const formatNumberDots = (val) => {
    if (!val && val !== 0) return '';
    const digitsOnly = String(val).replace(/[^\d]/g, '');
    if (!digitsOnly) return '';
    return parseInt(digitsOnly, 10).toLocaleString('id-ID');
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  // Add Item to Cart (Autocomplete select or direct barcode scan)
  const addProductToCart = (product) => {
    if (product.stock <= 0) {
      showCustomAlert(`Stock out for product '${product.name}'!`, 'Stock Out');
      return;
    }

    playBeepSound();
    setScannedFlash(true);
    setTimeout(() => setScannedFlash(false), 500);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(item => item.product.code === product.code);
      if (existingIndex !== -1) {
        const currentQty = prevCart[existingIndex].qty;
        if (currentQty >= product.stock) {
          showCustomAlert(`Quantity exceeds available stock (${product.stock} units)`, 'Stock Limit');
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1
        };
        return updated;
      } else {
        return [...prevCart, { product, qty: 1 }];
      }
    });

    // Clear search and refocus barcode
    setBarcodeQuery('');
    setSearchQuery('');
    setSearchResults([]);
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const q = barcodeQuery.trim().toLowerCase();
    if (!q) return;

    // Search exact barcode or product code or name
    const match = productsDb.find(p => p.code.toLowerCase() === q || String(p.id) === q || p.name.toLowerCase() === q);
    if (match) {
      addProductToCart(match);
    } else {
      showCustomAlert(`Barcode '${barcodeQuery}' not found in catalog!`, 'Product Not Found');
    }
  };

  // Adjust cart quantities via button or direct typing
  const updateItemQty = (code, delta) => {
    const idx = cart.findIndex(item => item.product.code === code);
    if (idx === -1) return;

    const currentQty = parseInt(cart[idx].qty, 10) || 0;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product.code !== code));
    } else {
      const maxStock = cart[idx].product.stock;
      if (newQty > maxStock) {
        showCustomAlert(`Quantity exceeds available stock (${maxStock} units)`, 'Stock Limit');
        return;
      }
      const updated = [...cart];
      updated[idx].qty = newQty;
      setCart(updated);
    }
  };

  const setItemQty = (code, valStr) => {
    const idx = cart.findIndex(item => item.product.code === code);
    if (idx === -1) return;

    if (valStr === '' || valStr === null) {
      const updated = [...cart];
      updated[idx].qty = '';
      setCart(updated);
      return;
    }

    let num = parseInt(valStr, 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    }

    const maxStock = cart[idx].product.stock;
    if (num > maxStock) {
      showCustomAlert(`Quantity exceeds available stock (${maxStock} units)`, 'Stock Limit');
      num = maxStock;
    }

    const updated = [...cart];
    updated[idx].qty = num;
    setCart(updated);
  };

  const removeCartItem = (code) => {
    setCart(cart.filter(item => item.product.code !== code));
  };

  // Cart financial summary
  const getSubtotal = () => cart.reduce((sum, item) => {
    const discount = item.discount || item.product.discount || 0;
    const itemQty = parseInt(item.qty, 10) || 0;
    return sum + ((item.product.price - discount) * itemQty);
  }, 0);
  const getTax = () => Math.round(getSubtotal() * 0.11);
  const getTotal = () => getSubtotal() + getTax();

  const getCashPaid = () => {
    if (paymentMethod !== 'TUNAI') return getTotal();
    const num = parseInt(cashInput.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const getChange = () => {
    if (paymentMethod !== 'TUNAI') return 0;
    const cash = getCashPaid();
    const total = getTotal();
    return cash >= total ? cash - total : 0;
  };

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;

    const totalVal = getTotal();
    const cashPaidVal = getCashPaid();

    if (paymentMethod === 'TUNAI') {
      if (!cashInput) {
        showCustomAlert('Please enter the amount received!', 'Payment Required');
        return;
      }
      if (cashPaidVal < totalVal) {
        showCustomAlert('Amount received is less than total price!', 'Insufficient Payment');
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
          price: item.product.price,
          discount: item.discount || item.product.discount || 0
        }))
      };

      const data = await request('/checkout', {
        method: 'POST',
        body: payload
      });

      const now = new Date();
      const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
      const nowTime = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now).replace(/\./g, ':');

      const newTrx = {
        id: data.transaction ? data.transaction.id : ('INV-' + Math.floor(100000 + Math.random() * 900000)),
        date: data.transaction ? data.transaction.date : nowDate,
        time: data.transaction ? data.transaction.time : nowTime,
        cashier: cashierName,
        subtotal: getSubtotal(),
        tax: getTax(),
        total: totalVal,
        items: payload.items,
        cashPaid: paymentMethod === 'TUNAI' ? cashPaidVal : totalVal,
        change: paymentMethod === 'TUNAI' ? (cashPaidVal - totalVal) : 0,
        method: paymentMethod
      };
      setTodayTrxCount(prev => prev + 1);
      setCheckoutResult(newTrx);
      try {
        localStorage.removeItem('payngo_history_cleared');
        const hist = JSON.parse(localStorage.getItem('payngo_transaction_history') || '[]');
        localStorage.setItem('payngo_transaction_history', JSON.stringify([newTrx, ...hist]));
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      const now = new Date();
      const nowDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
      const nowTime = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now).replace(/\./g, ':');

      const fallbackTrx = {
        id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        date: nowDate,
        time: nowTime,
        cashier: cashierName,
        subtotal: getSubtotal(),
        tax: getTax(),
        total: totalVal,
        items: cart.map(item => ({
          code: item.product.code,
          name: item.product.name,
          qty: item.qty,
          price: item.product.price,
          discount: item.discount || item.product.discount || 0
        })),
        cashPaid: paymentMethod === 'TUNAI' ? cashPaidVal : totalVal,
        change: paymentMethod === 'TUNAI' ? (cashPaidVal - totalVal) : 0,
        method: paymentMethod
      };
      setTodayTrxCount(prev => prev + 1);
      setCheckoutResult(fallbackTrx);
      try {
        const hist = JSON.parse(localStorage.getItem('payngo_transaction_history') || '[]');
        localStorage.setItem('payngo_transaction_history', JSON.stringify([fallbackTrx, ...hist]));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleNewTransaction = () => {
    setCart([]);
    setCashInput('');
    setPaymentMethod('TUNAI');
    setCheckoutResult(null);
    localStorage.removeItem('payngo_cashier_cart');
    localStorage.removeItem('payngo_cashier_cash_input');
  };

  const handleLogout = () => {
    showCustomConfirm(
      'Are you sure you want to log out of POS Cashier?',
      () => {
        localStorage.clear();
        navigate('/');
      },
      'Log Out',
      true
    );
  };

  return (
    <div className="dashboard-body" style={{ height: '100vh', overflow: 'hidden' }}>

      <div className="dashboard-wrapper" style={{ height: '100vh', overflow: 'hidden' }}>

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-medium)',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {!isSidebarCollapsed && (
              <span className="payngo-logo-brand">
                <span className="pay-part">Pay</span>
                <span className="amp-part">&amp;</span>
                <span className="go-part">Go</span>
              </span>
            )}
          </div>

          <div className="sidebar-header-divider"></div>

          <div className="user-profile-card">
            <div className="user-avatar" title={cashierName}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name" id="cashierName">{cashierName}</span>
              <span className="user-role">Employee ID: {cashierCode}</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <a href="#" className="menu-item active" onClick={(e) => e.preventDefault()} title="Transaction Menu">
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="12" y1="4" x2="12" y2="20"></line>
              </svg>
              <span className="menu-text-label">Transaction Menu</span>
            </a>

            <a
              href="#"
              className="menu-item"
              onClick={(e) => { e.preventDefault(); navigate('/cashier/history'); }}
              title="Transaction History"
            >
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="menu-text-label">Transaction History</span>
            </a>

            <div className="sidebar-footer">
              <a href="#" className="menu-item logout" onClick={(e) => { e.preventDefault(); handleLogout(); }} title="Logout">
                <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="menu-text-label">Logout</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Main POS Workspace */}
        <main className="dashboard-content" style={{ padding: '1.25rem', height: '100vh', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* POS Layout Panel Grid */}
          <div className="pos-desktop-layout" style={{ flex: 1, height: '100%', overflow: 'hidden' }}>

            {/* Left side: Cart Listing */}
            <div className="pos-left-side">

              {/* POS Cart items table card */}
              <div className="cart-list-card">
                <div className="cart-list-header">
                  <h2>Shopping Cart</h2>
                  <span className="cart-qty-badge">{cart.reduce((s, i) => s + i.qty, 0)} Items</span>
                </div>

                <div className="table-container">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>Code</th>
                        <th>Product</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '120px', textAlign: 'right' }}>Price</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>Discount</th>
                        <th style={{ width: '130px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody id="cartTableBody">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-cart-state" style={{ textAlign: 'center', padding: '4.5rem 1rem', color: 'var(--text-light)', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '56px', height: '56px', opacity: 0.25, color: 'var(--text-medium)' }}>
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => {
                          const itemDiscount = item.discount || item.product.discount || 0;
                          const itemTotal = (item.product.price - itemDiscount) * item.qty;
                          return (
                            <tr key={item.product.code}>
                              <td>
                                <span className="cart-item-code" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>
                                  {item.product.code}
                                </span>
                              </td>
                              <td>
                                <span className="cart-item-name" style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                  {item.product.name}
                                </span>
                              </td>
                              <td>
                                <div className="qty-controls" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                                  <button type="button" className="qty-btn" onClick={() => updateItemQty(item.product.code, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={item.qty}
                                    onChange={(e) => {
                                      const sanitized = e.target.value.replace(/[^\d]/g, '');
                                      setItemQty(item.product.code, sanitized);
                                    }}
                                    onBlur={() => {
                                      if (!item.qty || parseInt(item.qty, 10) < 1) {
                                        setItemQty(item.product.code, '1');
                                      }
                                    }}
                                    style={{
                                      width: '38px',
                                      height: '28px',
                                      textAlign: 'center',
                                      borderLeft: '1px solid var(--border-color)',
                                      borderRight: '1px solid var(--border-color)',
                                      borderTop: 'none',
                                      borderBottom: 'none',
                                      outline: 'none',
                                      background: 'transparent',
                                      fontSize: '0.875rem',
                                      fontWeight: 700,
                                      color: 'var(--text-dark)',
                                      padding: '0 2px'
                                    }}
                                  />
                                  <button type="button" className="qty-btn" onClick={() => updateItemQty(item.product.code, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>{formatRupiah(item.product.price)}</td>
                              <td style={{ textAlign: 'right', color: itemDiscount > 0 ? '#10b981' : 'var(--text-medium)' }}>
                                {itemDiscount > 0 ? `- ${formatRupiah(itemDiscount)}` : 'Rp 0'}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(itemTotal)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals + Integrated Payment Options */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                    <span>Subtotal</span>
                    <span>{formatRupiah(getSubtotal())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                    <span>VAT (11%)</span>
                    <span>{formatRupiah(getTax())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-hover)', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', marginBottom: '0.75rem' }}>
                    <span>Grand Total</span>
                    <span>{formatRupiah(getTotal())}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.35rem', display: 'block' }}>
                      Payment Method
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      {['TUNAI', 'QRIS', 'DEBIT'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            if (method !== 'TUNAI') setCashInput('');
                          }}
                          style={{
                            padding: '0.45rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: paymentMethod === method ? '1.5px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                            background: paymentMethod === method ? 'var(--primary-light)' : 'var(--bg-card)',
                            color: paymentMethod === method ? 'var(--primary-hover)' : 'var(--text-medium)',
                            cursor: 'pointer',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease'
                          }}
                        >
                          {method === 'TUNAI' ? 'Cash' : method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash Input / Payment Detail Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Amount Received..."
                        value={paymentMethod === 'TUNAI' ? cashInput : '0'}
                        disabled={paymentMethod !== 'TUNAI'}
                        readOnly={paymentMethod !== 'TUNAI'}
                        onChange={(e) => {
                          if (paymentMethod === 'TUNAI') {
                            const formatted = formatNumberDots(e.target.value);
                            setCashInput(formatted);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-color)',
                          outline: 'none',
                          background: paymentMethod !== 'TUNAI' ? '#f1f5f9' : '#ffffff',
                          color: paymentMethod !== 'TUNAI' ? '#94a3b8' : 'var(--text-dark)',
                          cursor: paymentMethod !== 'TUNAI' ? 'not-allowed' : 'text'
                        }}
                      />
                      <button
                        type="button"
                        disabled={paymentMethod !== 'TUNAI'}
                        onClick={() => {
                          if (paymentMethod === 'TUNAI') setCashInput(formatNumberDots(getTotal()));
                        }}
                        style={{
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          background: paymentMethod !== 'TUNAI' ? '#f1f5f9' : 'var(--primary-color)',
                          color: paymentMethod !== 'TUNAI' ? '#94a3b8' : '#ffffff',
                          border: paymentMethod !== 'TUNAI' ? '1px solid var(--border-color)' : 'none',
                          cursor: paymentMethod !== 'TUNAI' ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Exact Amount
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.65rem', background: paymentMethod !== 'TUNAI' ? '#f8fafc' : '#fff', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-medium)' }}>Change:</span>
                      <span style={{ fontWeight: 700, color: paymentMethod === 'TUNAI' ? (getCashPaid() >= getTotal() && getCashPaid() > 0 ? '#10b981' : '#ef4444') : '#ef4444' }}>
                        {paymentMethod === 'TUNAI' ? formatRupiah(getChange()) : 'Rp 0'}
                      </span>
                    </div>
                  </div>

                  {/* Complete Transaction Button */}
                  <button
                    type="button"
                    className="checkout-btn"
                    disabled={cart.length === 0 || (paymentMethod === 'TUNAI' && getCashPaid() < getTotal())}
                    onClick={handleCheckoutSubmit}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: cart.length === 0 || (paymentMethod === 'TUNAI' && getCashPaid() < getTotal()) ? '#cbd5e1' : 'var(--accent-orange)',
                      color: '#fff',
                      border: 'none',
                      cursor: cart.length === 0 || (paymentMethod === 'TUNAI' && getCashPaid() < getTotal()) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: cart.length === 0 || (paymentMethod === 'TUNAI' && getCashPaid() < getTotal()) ? 'none' : '0 4px 14px rgba(255, 112, 6, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Complete Transaction &amp; Print Receipt
                  </button>
                </div>
              </div>

            </div>

            {/* Right side: Search & Camera Scanner */}
            <div className="pos-right-side">

              {/* Barcode scan area */}
              <div className="search-section-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="product-search-block">
                  <div className="input-group">
                    <div className="input-wrapper search-box-wrapper">
                      <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        id="productSearchInput"
                        placeholder="Type product name or code..."
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
                            <span className="row-item-code">Barcode: {p.code} | Stock: {p.stock}</span>
                          </div>
                          <div className="row-right">
                            <span className="row-item-price">{formatRupiah(p.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ margin: 'auto 0' }}>
                  <div className="camera-scanner-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="camera-scanner-viewport" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', minHeight: '330px', height: '330px', background: '#090d16' }}>
                      <div id="reader" style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>

                      {/* Custom UI Overlays */}
                      <div className="scanner-scan-overlay" style={{ pointerEvents: 'none' }}>
                        <div className={`scanner-guidelines ${scannedFlash ? 'scanned' : ''}`}>
                          <span className="corner-tl"></span>
                          <span className="corner-tr"></span>
                          <span className="corner-bl"></span>
                          <span className="corner-br"></span>
                        </div>
                        {isCameraActive && <div className="scanner-laser-line"></div>}
                      </div>

                      {/* Success Scan Flash */}
                      {scannedFlash && <div className="flash-success"></div>}

                      {/* Status Badge */}
                      <div className="scanner-status-badge" style={{ pointerEvents: 'none' }}>
                        <div className="scanner-status-pulse"></div>
                        <span>{isCameraActive ? 'Webcam Active' : 'Camera Loading...'}</span>
                      </div>
                    </div>

                  </div>
                  {scannerError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '8px' }}>{scannerError}</p>}
                </div>

                {/* Visual Widget: Cash Drawer Action Button */}
                <div
                  className="cash-drawer-widget"
                  onClick={handleToggleDrawer}
                  style={{
                    marginTop: 'auto',
                    marginBottom: '0.65rem',
                    padding: '0.75rem 1rem',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-dark)', display: 'block' }}>
                      {isDrawerOpen ? 'Close Cash Drawer' : 'Open Cash Drawer'}
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: isDrawerOpen ? '#ef4444' : '#10b981',
                      border: isDrawerOpen ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isDrawerOpen ? 'Close' : 'Open'}
                  </button>
                </div>

                {/* Live Clock Widget */}
                <div className="time-tracker" style={{ paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="time-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span id="liveClock" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)' }}>{liveTime}</span>
                </div>
              </div>

            </div>

          </div>

        </main>

        {/* Custom Popup Confirmation / Alert Dialog Modal */}
        {dialogConfig && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.75rem 1.5rem',
                maxWidth: '380px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
                animation: 'scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: dialogConfig.type === 'confirm' ? '#fef3c7' : '#fee2e2', color: dialogConfig.type === 'confirm' ? '#d97706' : '#ef4444', marginBottom: '1rem' }}>
                {dialogConfig.type === 'confirm' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 0.4rem 0' }}>
                {dialogConfig.title || (dialogConfig.type === 'confirm' ? 'Confirmation' : 'Notice')}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                {dialogConfig.message}
              </p>

              {dialogConfig.type === 'confirm' ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={dialogConfig.onCancel}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-dark)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={dialogConfig.onConfirm}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: dialogConfig.isDestructive ? '#ef4444' : 'var(--primary-color)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      boxShadow: dialogConfig.isDestructive ? '0 4px 12px rgba(239, 68, 68, 0.25)' : '0 4px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={dialogConfig.onConfirm}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-color)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        )}

        {/* Receipt Modal Overlay */}
        {checkoutResult && (
          <div className="receipt-modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div className="receipt-container" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', maxWidth: '360px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div className="receipt-paper" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                <div className="receipt-header" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>PAY &amp; GO MART</h2>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0' }}>Jl. Mini Market No. 88, Jakarta</p>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Tel: (021) 555-0199</p>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Inv No:</span> <span>{checkoutResult.id}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Time:</span> <span>{checkoutResult.date} {checkoutResult.time}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cashier:</span> <span>{checkoutResult.cashier}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Method:</span> <span>{checkoutResult.method}</span></div>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {checkoutResult.items.map(item => (
                    <div key={item.code || item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{item.name}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.qty} x {formatRupiah(item.price)}</span>
                        <span>{formatRupiah(item.qty * (item.price - (item.discount || 0)))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <span>{formatRupiah(checkoutResult.subtotal)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT (11%):</span> <span>{formatRupiah(checkoutResult.tax)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.2rem' }}>
                    <span>TOTAL:</span> <span>{formatRupiah(checkoutResult.total)}</span>
                  </div>
                  {checkoutResult.method === 'TUNAI' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid:</span> <span>{formatRupiah(checkoutResult.cashPaid)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change:</span> <span>{formatRupiah(checkoutResult.change)}</span></div>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }}></div>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>Thank You!</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.68rem', color: '#64748b' }}>Please keep this receipt as proof of payment</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleNewTransaction}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f1f5f9', color: 'var(--text-dark)', fontWeight: 700, cursor: 'pointer' }}
                >
                  New Transaction
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CashierDashboard;
