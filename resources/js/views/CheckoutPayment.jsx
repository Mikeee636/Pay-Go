import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../api';

function CheckoutPayment() {
  const navigate = useNavigate();

  const [cashierName, setCashierName] = useState('Cashier');
  const [paymentMethod, setPaymentMethod] = useState('TUNAI');
  const [cashInput, setCashInput] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [cart, setCart] = useState([]);

  const formatRupiah = (num) => 'Rp ' + num.toLocaleString('id-ID');

  // Load cart from sessionStorage
  useEffect(() => {
    const role = localStorage.getItem('currentUserRole');
    const name = localStorage.getItem('currentUserName');
    if (role !== 'Karyawan') {
      navigate('/');
      return;
    }
    setCashierName(name || 'Cashier');

    const savedCart = sessionStorage.getItem('pos_cart');
    if (!savedCart) {
      alert('Keranjang belanja kosong. Silakan tambahkan produk terlebih dahulu.');
      navigate('/cashier');
      return;
    }
    const parsed = JSON.parse(savedCart);
    if (!parsed || parsed.length === 0) {
      alert('Keranjang belanja kosong. Silakan tambahkan produk terlebih dahulu.');
      navigate('/cashier');
      return;
    }
    setCart(parsed);
  }, [navigate]);

  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const getTax = () => Math.round(getSubtotal() * 0.11);
  const getTotal = () => getSubtotal() + getTax();

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
        return;
      }
      if (cashPaidVal < totalVal) {
        alert('Uang yang diterima kurang dari total belanja!');
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

      // Clear cart from session
      sessionStorage.removeItem('pos_cart');
    } catch (err) {
      alert(err.message || 'Gagal memproses transaksi.');
    }
  };

  const handlePrintReceipt = () => window.print();

  const handleNewTransaction = () => {
    sessionStorage.removeItem('pos_cart');
    navigate('/cashier');
  };

  const handleBackToCart = () => {
    navigate('/cashier');
  };

  return (
    <div className="dashboard-body">
      <div className="dashboard-wrapper">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container">
              <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
                <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" strokeWidth="8" strokeLinecap="round" />
                <circle cx="50" cy="55" r="10" fill="#ffffff" />
                <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="logo-text">Pay <span className="logo-text-accent">&amp; Go</span></span>
            </div>
          </div>

          <div className="user-profile-card">
            <div className="user-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="user-name">{cashierName}</span>
              <span className="user-role">Cashier</span>
            </div>
          </div>

          <nav className="sidebar-menu">
            <a href="#" className="menu-item" onClick={(e) => { e.preventDefault(); handleBackToCart(); }}>
              <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Cashier
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          <header className="topbar">
            <div className="topbar-left">
              <h1>Payment Process</h1>
              <p className="subtitle">Select payment method and complete the transaction</p>
            </div>
            <div className="topbar-right">
              <button
                type="button"
                onClick={handleBackToCart}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '8px', border: '1.5px solid var(--border-color)',
                  background: 'var(--bg-card)', color: 'var(--text-medium)', fontWeight: 600,
                  fontSize: '0.875rem', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Cashier
              </button>
            </div>
          </header>

          <div className="pos-desktop-layout">

            {/* Left: Order Summary */}
            <div className="pos-left-side">
              <div className="cart-list-card">
                <div className="cart-list-header">
                  <h2>Order Summary</h2>
                  <span className="cart-qty-badge">{cart.reduce((s, i) => s + i.qty, 0)} Item</span>
                </div>
                <div className="table-container">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No</th>
                        <th>Product Name</th>
                        <th style={{ width: '130px' }}>Unit Price</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={item.product.code}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="cart-item-info">
                              <span className="cart-item-name">{item.product.name}</span>
                              <span className="cart-item-code">{item.product.code}</span>
                            </div>
                          </td>
                          <td>{formatRupiah(item.product.price)}</td>
                          <td style={{ textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(item.product.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                    <span>Subtotal</span>
                    <span>{formatRupiah(getSubtotal())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-medium)' }}>
                    <span>VAT (11%)</span>
                    <span>{formatRupiah(getTax())}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem', color: 'var(--primary-hover)', paddingTop: '10px', borderTop: '2px dashed var(--border-color)' }}>
                    <span>Grand Total</span>
                    <span>{formatRupiah(getTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment */}
            <div className="pos-right-side">
              <div className="checkout-summary-card">
                <h2>Payment Method</h2>

                <form onSubmit={handleCheckoutSubmit}>
                  <div className="input-group">
                    <div className="payment-options-grid">
                      {/* TUNAI */}
                      <label className="payment-method-label">
                        <input
                          type="radio" name="paymentMethod" value="TUNAI"
                          checked={paymentMethod === 'TUNAI'}
                          onChange={() => setPaymentMethod('TUNAI')}
                        />
                        <span className="method-box">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <line x1="2" y1="10" x2="22" y2="10"></line>
                          </svg>
                          TUNAI
                        </span>
                      </label>
                      {/* DEBIT/QRIS */}
                      <label className="payment-method-label">
                        <input
                          type="radio" name="paymentMethod" value="DEBIT"
                          checked={paymentMethod === 'DEBIT'}
                          onChange={() => { setPaymentMethod('DEBIT'); setCashInput(''); }}
                        />
                        <span className="method-box">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <path d="M3 9h18"></path>
                            <path d="M9 21V9"></path>
                          </svg>
                          DEBIT / QRIS
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Grand Total display */}
                  <div style={{
                    background: 'linear-gradient(135deg, hsl(142,70%,42%) 0%, hsl(142,70%,32%) 100%)',
                    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center'
                  }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginBottom: '4px' }}>Total amount due</p>
                    <p style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{formatRupiah(getTotal())}</p>
                  </div>

                  {/* Cash input */}
                  {paymentMethod === 'TUNAI' && (
                    <>
                      <div className="input-group" id="cashReceivedGroup">
                        <label htmlFor="cashReceived">Cash Received</label>
                        <div className="input-wrapper">
                          <span className="input-currency-prefix">Rp</span>
                          <input
                            type="text" id="cashReceived"
                            placeholder="0" value={cashInput}
                            onChange={(e) => setCashInput(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="return-price-card" id="changeGroup">
                        <span>Change</span>
                        <h3>{formatRupiah(getChange())}</h3>
                      </div>
                    </>
                  )}

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="submit" className="checkout-btn" disabled={cart.length === 0}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Pay & Print Receipt
                    </button>
                    <button type="button" onClick={handleBackToCart}
                      style={{
                        width: '100%', padding: '0.875rem', borderRadius: '10px',
                        border: '1.5px solid var(--border-color)', background: 'transparent',
                        color: 'var(--text-medium)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                      }}
                    >
                      ← Back & Edit Cart
                    </button>
                  </div>

                  <div className="keyboard-shortcuts-notice" style={{ marginTop: '1rem' }}>
                    <span className="notice-title">Info</span>
                    <div className="shortcut-row"><span>CASH</span> <span>Enter amount then pay</span></div>
                    <div className="shortcut-row"><span>DEBIT/QRIS</span> <span>Directly process payment</span></div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Receipt Modal */}
      {checkoutResult && (
        <div className="modal-overlay" id="receiptModal" style={{ display: 'flex' }}>
          <div className="receipt-modal-container scale-up">
            <div className="receipt-paper">
              <div className="receipt-header">
                <svg className="receipt-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <rect x="20" y="30" width="60" height="50" rx="12" fill="var(--primary-color)" />
                  <path d="M35,30 C35,18 40,12 50,12 C60,12 65,18 65,30" fill="none" stroke="var(--primary-color)" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="50" cy="55" r="10" fill="#ffffff" />
                  <path d="M47,55 L52,60 L60,49" fill="none" stroke="var(--primary-color)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3>PAY &amp; GO</h3>
                <p>FreshMarket Supermarket</p>
                <p>Jl. Jenderal Sudirman No. 45, Jakarta</p>
              </div>
              <div className="receipt-meta">
                <div className="meta-row"><span>Invoice No:</span> <span>{checkoutResult.id}</span></div>
                <div className="meta-row"><span>Date:</span> <span>{checkoutResult.date} {checkoutResult.time}</span></div>
                <div className="meta-row"><span>Cashier:</span> <span>{checkoutResult.cashier}</span></div>
                <div className="meta-row"><span>Method:</span> <span>{checkoutResult.method}</span></div>
              </div>
              <div className="receipt-divider"></div>
              <div className="receipt-items-body">
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
              <div className="receipt-totals">
                <div className="totals-row"><span>Subtotal:</span> <span>{formatRupiah(checkoutResult.subtotal)}</span></div>
                <div className="totals-row"><span>PPN (11%):</span> <span>{formatRupiah(checkoutResult.tax)}</span></div>
                <div className="totals-row grand-total-row"><span>TOTAL:</span> <span>{formatRupiah(checkoutResult.total)}</span></div>
                {checkoutResult.method === 'TUNAI' && (
                  <>
                    <div className="totals-row"><span>Cash Received:</span> <span>{formatRupiah(checkoutResult.cashPaid)}</span></div>
                    <div className="totals-row"><span>Change:</span> <span>{formatRupiah(checkoutResult.change)}</span></div>
                  </>
                )}
              </div>
              <div className="receipt-divider"></div>
              <div className="receipt-barcode">
                <svg className="receipt-barcode-svg" viewBox="0 0 100 40">
                  <g fill="#000000">
                    <rect x="10" y="5" width="2" height="25" /><rect x="14" y="5" width="4" height="25" />
                    <rect x="20" y="5" width="1" height="25" /><rect x="23" y="5" width="3" height="25" />
                    <rect x="28" y="5" width="2" height="25" /><rect x="32" y="5" width="4" height="25" />
                    <rect x="38" y="5" width="1" height="25" /><rect x="41" y="5" width="3" height="25" />
                    <rect x="46" y="5" width="2" height="25" /><rect x="50" y="5" width="4" height="25" />
                    <rect x="56" y="5" width="1" height="25" /><rect x="59" y="5" width="3" height="25" />
                    <rect x="64" y="5" width="2" height="25" /><rect x="68" y="5" width="4" height="25" />
                    <rect x="74" y="5" width="1" height="25" /><rect x="77" y="5" width="3" height="25" />
                    <rect x="82" y="5" width="2" height="25" /><rect x="86" y="5" width="4" height="25" />
                  </g>
                  <text x="50" y="38" textAnchor="middle" fontSize="5" fontFamily="monospace">{checkoutResult.id}</text>
                </svg>
              </div>
              <div className="receipt-footer">
                <p>Thank you for your visit</p>
                <p>Purchased items cannot be exchanged</p>
              </div>
            </div>
            <div className="receipt-actions">
              <button type="button" className="receipt-action-btn print-btn" onClick={handlePrintReceipt}>Print Receipt</button>
              <button type="button" className="receipt-action-btn new-trx-btn" onClick={handleNewTransaction}>New Transaction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckoutPayment;
