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
  // Mock Defaults in case databases are missing
  // ==========================================================================
  const DEFAULT_TRANSACTIONS = [
    { id: 'TRX-20260803-8712', date: '2026-08-03', time: '16:04', cashier: 'Budi Santoso', subtotal: 65765, tax: 7235, total: 73000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 2, price: 18000 }, { name: 'Minyak Goreng Sawit Refill 2L', qty: 1, price: 34000 }] },
    { id: 'TRX-20260803-1254', date: '2026-08-03', time: '15:52', cashier: 'Budi Santoso', subtotal: 16216, tax: 1784, total: 18000, items: [{ name: 'Kopi Susu Gula Aren 250ml', qty: 1, price: 18000 }] },
    { id: 'TRX-20260803-3498', date: '2026-08-03', time: '15:40', cashier: 'Siti Aminah', subtotal: 112162, tax: 12338, total: 124500, items: [{ name: 'Roti Tawar Gandum FreshMarket', qty: 2, price: 15000 }, { name: 'Susu Cair UHT Full Cream 1L', qty: 3, price: 22000 }] },
    { id: 'TRX-20260803-6231', date: '2026-08-03', time: '15:15', cashier: 'Ahmad Hidayat', subtotal: 37838, tax: 4162, total: 42000, items: [{ name: 'Susu Cair UHT Full Cream 1L', qty: 1, price: 22000 }, { name: 'Teh Hijau Jasmine Botol 450ml', qty: 3, price: 6000 }] },
    { id: 'TRX-20260803-9021', date: '2026-08-03', time: '14:50', cashier: 'Siti Aminah', subtotal: 230630, tax: 25370, total: 256000, items: [{ name: 'Minyak Goreng Sawit Refill 2L', qty: 5, price: 34000 }, { name: 'Sabun Mandi Cair Lemon 400ml', qty: 3, price: 26000 }] }
  ];

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

  // Controls
  const periodFilter = document.getElementById('periodFilter');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');

  // Cards
  const salesRevenueNode = document.getElementById('salesRevenue');
  const salesUnitsNode = document.getElementById('salesUnits');
  const salesTrxCountNode = document.getElementById('salesTrxCount');
  const salesAvgCartNode = document.getElementById('salesAvgCart');

  // Chart & Listing
  const chartCanvasGroup = document.getElementById('chartCanvasGroup');
  const bestSellersList = document.getElementById('bestSellersList');

  // Audit Modal
  const auditPdfModal = document.getElementById('auditPdfModal');
  const closeAuditModalXBtn = document.getElementById('closeAuditModalXBtn');
  const closeAuditModalBtn = document.getElementById('closeAuditModalBtn');
  const printAuditBtn = document.getElementById('printAuditBtn');

  const auditPeriodText = document.getElementById('auditPeriodText');
  const auditTrxCount = document.getElementById('auditTrxCount');
  const auditUnitsSold = document.getElementById('auditUnitsSold');
  const auditTaxSum = document.getElementById('auditTaxSum');
  const auditRevenueSum = document.getElementById('auditRevenueSum');
  const auditProductsBody = document.getElementById('auditProductsBody');
  const auditSignName = document.getElementById('auditSignName');

  // ==========================================================================
  // Clock and User Sessions
  // ==========================================================================
  const activeUserName = localStorage.getItem('currentUserName');
  if (activeUserName && adminName) {
    adminName.textContent = activeUserName;
    auditSignName.textContent = activeUserName;
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

  function leadZero(num) {
    return String(num).padStart(2, '0');
  }

  // ==========================================================================
  // Core Analytical & Rendering Logic
  // ==========================================================================
  
  // Stores currently computed report details for PDF/Excel exports
  let activeFilteredTrx = [];
  let activeTopProducts = [];
  let currentPeriodLabel = 'Semua Waktu';

  function renderSalesReport() {
    const transactions = getTransactions();
    const period = periodFilter.value;

    const now = new Date();
    // Reset hours to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);

    // 1. Period Filtering Logic
    let filtered = [];

    if (period === 'TODAY') {
      currentPeriodLabel = 'Hari Ini (Senin)';
      // Matching YYYY-MM-DD
      const todayStr = `${now.getFullYear()}-${leadZero(now.getMonth() + 1)}-${leadZero(now.getDate())}`;
      filtered = transactions.filter(t => t.date === todayStr);
    } 
    else if (period === 'LAST_7_DAYS') {
      currentPeriodLabel = '7 Hari Terakhir';
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() - 7);
      thresholdDate.setHours(0, 0, 0, 0);

      filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= thresholdDate;
      });
    } 
    else if (period === 'LAST_30_DAYS') {
      currentPeriodLabel = '30 Hari Terakhir';
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() - 30);
      thresholdDate.setHours(0, 0, 0, 0);

      filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= thresholdDate;
      });
    } 
    else {
      currentPeriodLabel = 'Semua Waktu';
      filtered = [...transactions];
    }

    // Sort by date ascending for trend chart plotting
    filtered.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    activeFilteredTrx = filtered;

    // 2. Compute Summary Statistics Cards
    let revenueSum = 0; // Omzet Bersih (Grand Total - PPN)
    let unitsCount = 0;
    let taxSum = 0;
    let trxCount = filtered.length;

    // Map to count product quantities
    const productSalesMap = {};

    filtered.forEach(t => {
      taxSum += t.tax;
      revenueSum += t.subtotal; // Subtotal represents net revenue (before PPN tax)
      
      t.items.forEach(item => {
        unitsCount += item.qty;
        
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { qty: 0, val: 0 };
        }
        productSalesMap[item.name].qty += item.qty;
        productSalesMap[item.name].val += (item.qty * item.price);
      });
    });

    const avgCart = trxCount > 0 ? Math.round((revenueSum + taxSum) / trxCount) : 0;

    // Update Summary widgets
    salesRevenueNode.textContent = formatRupiah(revenueSum);
    salesUnitsNode.textContent = `${unitsCount} unit`;
    salesTrxCountNode.textContent = trxCount;
    salesAvgCartNode.textContent = formatRupiah(avgCart);

    // 3. Compile and Render Best Selling Products
    const sortedProducts = Object.keys(productSalesMap).map(name => ({
      name: name,
      qty: productSalesMap[name].qty,
      val: productSalesMap[name].val
    })).sort((a, b) => b.qty - a.qty);

    activeTopProducts = sortedProducts;

    bestSellersList.innerHTML = '';
    
    if (sortedProducts.length === 0) {
      bestSellersList.innerHTML = `
        <div style="text-align: center; color: var(--text-light); padding: 2rem 0;">
          Belum ada produk terjual pada periode ini.
        </div>
      `;
    } else {
      const maxQty = sortedProducts[0].qty || 1;
      
      // Render top 5
      sortedProducts.slice(0, 5).forEach((prod, index) => {
        const percent = Math.round((prod.qty / maxQty) * 100);
        
        const prodItem = document.createElement('div');
        prodItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--text-dark); margin-bottom: 0.35rem;">
            <span>${index + 1}. ${prod.name}</span>
            <span style="color: var(--primary-hover);">${prod.qty} unit</span>
          </div>
          <div style="background-color: hsl(140, 10%, 93%); border-radius: 5px; height: 8px; overflow: hidden; margin-bottom: 0.15rem;">
            <div style="background-color: var(--primary-color); height: 100%; width: ${percent}%; border-radius: 5px; transition: width 0.8s ease-out;"></div>
          </div>
          <div style="font-size: 0.725rem; color: var(--text-light); text-align: right;">
            Omzet: ${formatRupiah(prod.val)}
          </div>
        `;
        bestSellersList.appendChild(prodItem);
      });
    }

    // 4. Draw dynamic Line Chart using SVG
    chartCanvasGroup.innerHTML = '';
    
    // Group revenue by date
    const dailyRevenueMap = {};
    filtered.forEach(t => {
      if (!dailyRevenueMap[t.date]) {
        dailyRevenueMap[t.date] = 0;
      }
      dailyRevenueMap[t.date] += t.subtotal; // Omzet Bersih
    });

    const dailyDates = Object.keys(dailyRevenueMap).sort();
    const dataPoints = dailyDates.map(date => ({
      date: date,
      val: dailyRevenueMap[date]
    }));

    if (dataPoints.length === 0) {
      // Empty placeholder SVG text
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', '300');
      txt.setAttribute('y', '140');
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('fill', 'var(--text-light)');
      txt.setAttribute('style', 'font-family: var(--font-body); font-size: 0.9rem;');
      txt.textContent = 'Tidak ada transaksi untuk digambar pada grafik';
      chartCanvasGroup.appendChild(txt);
      return;
    }

    // Plotting dimensions parameters
    const svgW = 600;
    const svgH = 280;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 40;
    const paddingBottom = 40;

    const plotW = svgW - paddingLeft - paddingRight;
    const plotH = svgH - paddingTop - paddingBottom;

    // Find max value for scaling y axis
    let maxVal = Math.max(...dataPoints.map(p => p.val));
    if (maxVal === 0) maxVal = 100000;
    
    // Axis values labels (y-axis gridlines)
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const stepVal = Math.round((maxVal / steps) * i);
      const y = paddingTop + plotH - (stepVal / maxVal) * plotH;
      
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', String(paddingLeft - 8));
      txt.setAttribute('y', String(y + 4));
      txt.setAttribute('text-anchor', 'end');
      txt.setAttribute('fill', 'var(--text-light)');
      txt.setAttribute('style', 'font-family: var(--font-body); font-size: 0.65rem; font-weight: 500;');
      txt.textContent = formatRupiah(stepVal).replace('Rp ', '');
      chartCanvasGroup.appendChild(txt);
    }

    // Calculate coordinates for points
    const points = [];
    const count = dataPoints.length;

    dataPoints.forEach((p, idx) => {
      const x = count === 1 ? paddingLeft + plotW / 2 : paddingLeft + (idx / (count - 1)) * plotW;
      const y = paddingTop + plotH - (p.val / maxVal) * plotH;
      points.push({ x: x, y: y, label: p.date, raw: p.val });
    });

    // 1. Build fill path
    let areaPathD = '';
    if (points.length === 1) {
      areaPathD = `M ${points[0].x - 30} ${paddingTop + plotH} L ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y} L ${points[0].x + 30} ${paddingTop + plotH} Z`;
    } else {
      areaPathD = `M ${points[0].x} ${paddingTop + plotH} `;
      points.forEach(pt => {
        areaPathD += `L ${pt.x} ${pt.y} `;
      });
      areaPathD += `L ${points[points.length - 1].x} ${paddingTop + plotH} Z`;
    }

    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaPathD);
    areaPath.setAttribute('fill', 'url(#chartGrad)');
    chartCanvasGroup.appendChild(areaPath);

    // 2. Build stroke path
    let linePathD = '';
    if (points.length === 1) {
      linePathD = `M ${points[0].x - 30} ${points[0].y} L ${points[0].x + 30} ${points[0].y}`;
    } else {
      linePathD = `M ${points[0].x} ${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        linePathD += `L ${points[i].x} ${points[i].y} `;
      }
    }

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', linePathD);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', 'var(--primary-color)');
    linePath.setAttribute('stroke-width', '3');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    chartCanvasGroup.appendChild(linePath);

    // 3. Add points circles & X Labels
    points.forEach((pt, idx) => {
      // Dot circle
      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circ.setAttribute('cx', String(pt.x));
      circ.setAttribute('cy', String(pt.y));
      circ.setAttribute('r', '5');
      circ.setAttribute('fill', '#ffffff');
      circ.setAttribute('stroke', 'var(--primary-color)');
      circ.setAttribute('stroke-width', '2.5');
      chartCanvasGroup.appendChild(circ);

      // Tooltip hover value (simple SVG title)
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${pt.label}: ${formatRupiah(pt.raw)}`;
      circ.appendChild(title);

      // X Axis Date labels (only display a subset if too many points)
      let shouldShowLabel = true;
      if (count > 8) {
        // Show labels for first, last, and every Nth step
        shouldShowLabel = (idx === 0) || (idx === count - 1) || (idx % Math.floor(count / 4) === 0);
      }

      if (shouldShowLabel) {
        const parts = pt.label.split('-');
        const dateFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : pt.label;
        
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', String(pt.x));
        txt.setAttribute('y', String(paddingTop + plotH + 18));
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('fill', 'var(--text-medium)');
        txt.setAttribute('style', 'font-family: var(--font-body); font-size: 0.65rem; font-weight: 600;');
        txt.textContent = dateFormatted;
        chartCanvasGroup.appendChild(txt);
      }
    });
  }

  // Bind change event filter
  periodFilter.addEventListener('change', renderSalesReport);

  // ==========================================================================
  // Export Excel/CSV Utility (Offline Compatible Blob)
  // ==========================================================================
  exportExcelBtn.addEventListener('click', () => {
    if (activeFilteredTrx.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    // 1. Generate transactions rekap CSV content
    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
    csvContent += 'LAPORAN REKAPITULASI PENJUALAN - PAY & GO\n';
    csvContent += `Periode: ,${currentPeriodLabel}\n\n`;
    csvContent += 'Invoice ID,Tanggal,Waktu,Kasir,Subtotal (Net),Pajak (PPN 11%),Grand Total\n';
    
    activeFilteredTrx.forEach(t => {
      csvContent += `"${t.id}","${t.date}","${t.time}","${t.cashier.replace(/"/g, '""')}",${t.subtotal},${t.tax},${t.total}\n`;
    });

    // 2. Add Top Selling product list rekap
    csvContent += '\nPRODUK TERLARIS\n';
    csvContent += 'Peringkat,Nama Produk,Kuantitas Terjual,Omzet Produk\n';
    
    activeTopProducts.forEach((prod, index) => {
      csvContent += `${index + 1},"${prod.name.replace(/"/g, '""')}",${prod.qty},${prod.val}\n`;
    });

    // 3. Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `laporan-penjualan-${currentPeriodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`;

    const link = document.createElement('a');
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  // ==========================================================================
  // Export PDF / formal printable modal dialog controls
  // ==========================================================================
  exportPdfBtn.addEventListener('click', () => {
    // Populate formal audit paper text fields
    auditPeriodText.textContent = currentPeriodLabel;
    
    let taxSum = 0;
    let revenueSum = 0;
    let unitsCount = 0;
    activeFilteredTrx.forEach(t => {
      taxSum += t.tax;
      revenueSum += t.subtotal;
      t.items.forEach(i => unitsCount += i.qty);
    });

    auditTrxCount.textContent = activeFilteredTrx.length;
    auditUnitsSold.textContent = `${unitsCount} unit`;
    auditTaxSum.textContent = formatRupiah(taxSum);
    auditRevenueSum.textContent = formatRupiah(revenueSum);

    // Populate formal products table rows
    auditProductsBody.innerHTML = '';
    
    if (activeTopProducts.length === 0) {
      auditProductsBody.innerHTML = `
        <tr>
          <td colspan="4" style="padding: 1rem; text-align: center; color: #718096;">
            Tidak ada data penjualan produk.
          </td>
        </tr>
      `;
    } else {
      activeTopProducts.forEach((prod, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #edf2f7';
        tr.innerHTML = `
          <td style="padding: 0.65rem 0.5rem; text-align: left;">${index + 1}</td>
          <td style="padding: 0.65rem 0.5rem; text-align: left; font-weight: 500;">${prod.name}</td>
          <td style="padding: 0.65rem 0.5rem; text-align: center; font-weight: 600;">${prod.qty} unit</td>
          <td style="padding: 0.65rem 0.5rem; text-align: right; font-weight: 700; color: #2d3748;">${formatRupiah(prod.val)}</td>
        `;
        auditProductsBody.appendChild(tr);
      });
    }

    // Reveal modal
    auditPdfModal.classList.remove('hidden');
  });

  // Close formal audit modal
  function closeAuditModal() {
    auditPdfModal.classList.add('hidden');
  }

  closeAuditModalXBtn.addEventListener('click', closeAuditModal);
  closeAuditModalBtn.addEventListener('click', closeAuditModal);
  auditPdfModal.addEventListener('click', (e) => {
    if (e.target === auditPdfModal) {
      closeAuditModal();
    }
  });

  // Print audit sheet
  printAuditBtn.addEventListener('click', () => {
    window.print();
  });

  // ==========================================================================
  // Initial Dashboard Render
  // ==========================================================================
  renderSalesReport();
});
