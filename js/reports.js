/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * reports.js - Analytics Engine & Pure Vanilla Canvas Charts
 * 
 * STRICT ZERO GST COMPLIANCE.
 */

const Dashboard = (() => {
  let dom = {};
  let currentChartPeriod = 'today';

  function init() {
    cacheDom();
    bindEvents();
    render();
  }

  function cacheDom() {
    dom = {
      cardTodaySales: document.getElementById('stat-today-sales'),
      cardTodayBills: document.getElementById('stat-today-bills'),
      cardTotalProducts: document.getElementById('stat-total-products'),
      cardTotalCustomers: document.getElementById('stat-total-customers'),
      cardAvgBill: document.getElementById('stat-avg-bill'),

      chartCanvas: document.getElementById('sales-overview-chart'),
      chartPeriodBtns: document.querySelectorAll('.chart-period-btn'),

      recentBillsTbody: document.getElementById('recent-bills-tbody')
    };
  }

  function bindEvents() {
    if (dom.chartPeriodBtns) {
      dom.chartPeriodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          dom.chartPeriodBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentChartPeriod = btn.dataset.period || 'today';
          drawSalesChart();
        });
      });
    }

    // Resize listener for responsive chart
    window.addEventListener('resize', () => {
      if (document.getElementById('screen-dashboard').classList.contains('active-screen')) {
        drawSalesChart();
      }
    });
  }

  function render() {
    const products = DB.getProducts();
    const customers = DB.getCustomers();
    const bills = DB.getBills();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => b.date === todayStr);

    const todaySales = todayBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const totalSales = bills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const avgBill = bills.length > 0 ? (totalSales / bills.length) : 0;

    const currency = '₹';

    if (dom.cardTodaySales) dom.cardTodaySales.textContent = `${currency}${todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (dom.cardTodayBills) dom.cardTodayBills.textContent = todayBills.length.toString();
    if (dom.cardTotalProducts) dom.cardTotalProducts.textContent = products.length.toString();
    if (dom.cardTotalCustomers) dom.cardTotalCustomers.textContent = customers.length.toString();
    if (dom.cardAvgBill) dom.cardAvgBill.textContent = `${currency}${avgBill.toFixed(2)}`;

    drawSalesChart();
    renderRecentBills(bills.slice(0, 6));
  }

  function renderRecentBills(recentBills) {
    if (!dom.recentBillsTbody) return;

    if (recentBills.length === 0) {
      dom.recentBillsTbody.innerHTML = `
        <tr><td colspan="7" class="text-center py-4 text-muted">No recent bills. Create one in New Bill screen.</td></tr>
      `;
      return;
    }

    const currency = '₹';
    dom.recentBillsTbody.innerHTML = recentBills.map(b => `
      <tr>
        <td><strong class="text-gold">${b.billNo}</strong></td>
        <td>${escapeHtml(b.customerName || 'Walk-in Customer')}</td>
        <td>${b.date} <small class="text-muted">${b.time || ''}</small></td>
        <td>${b.items ? b.items.length : 0} items</td>
        <td><strong>${currency}${Number(b.grandTotal).toFixed(2)}</strong></td>
        <td><span class="badge-pay badge-pay-${(b.paymentMethod || 'cash').toLowerCase()}">${b.paymentMethod || 'Cash'}</span></td>
        <td>
          <div class="action-btn-group">
            <button type="button" class="btn-icon-action" onclick="Sales.viewBillDetail('${b.billNo}')" title="View Bill">👁️</button>
            <button type="button" class="btn-icon-action" onclick="Sales.reprintBill('${b.billNo}')" title="Print Bill">🖨️</button>
            <button type="button" class="btn-icon-action" onclick="InvoicePDF.generate(DB.getBillByNo('${b.billNo}'))" title="PDF">📄</button>
            <button type="button" class="btn-icon-action" onclick="WhatsAppShare.share(DB.getBillByNo('${b.billNo}'))" title="WhatsApp">💬</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Pure Canvas Sales Chart Drawing
  function drawSalesChart() {
    const canvas = dom.chartCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    canvas.width = (rect.width || 600) * dpr;
    canvas.height = 240 * dpr;
    canvas.style.width = `${rect.width || 600}px`;
    canvas.style.height = '240px';

    ctx.scale(dpr, dpr);
    const w = rect.width || 600;
    const h = 240;

    ctx.clearRect(0, 0, w, h);

    const bills = DB.getBills();
    let labels = [];
    let dataPoints = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (currentChartPeriod === 'today') {
      // Hourly bins (9 AM to 9 PM)
      labels = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '9 PM'];
      dataPoints = [0, 0, 0, 0, 0, 0, 0];
      const todayBills = bills.filter(b => b.date === todayStr);

      todayBills.forEach(b => {
        // Distribute nicely based on time
        const hour = parseInt(b.time || '12', 10);
        let idx = 2; // default 1 PM
        if (hour < 10) idx = 0;
        else if (hour < 12) idx = 1;
        else if (hour < 14) idx = 2;
        else if (hour < 16) idx = 3;
        else if (hour < 18) idx = 4;
        else if (hour < 20) idx = 5;
        else idx = 6;
        dataPoints[idx] += Number(b.grandTotal) || 0;
      });
    } else if (currentChartPeriod === 'week') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dStr = d.toISOString().split('T')[0];
        labels.push(days[d.getDay()]);
        const daySum = bills.filter(b => b.date === dStr).reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
        dataPoints.push(daySum);
      }
    } else {
      // This month in 4 weeks
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthBills = bills.filter(b => b.date && b.date.startsWith(monthPrefix));
      dataPoints = [0, 0, 0, 0];
      monthBills.forEach(b => {
        const day = parseInt(b.date.split('-')[2], 10);
        const wIdx = Math.min(3, Math.floor((day - 1) / 7));
        dataPoints[wIdx] += Number(b.grandTotal) || 0;
      });
    }

    const padding = { top: 25, right: 30, bottom: 40, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...dataPoints, 1000) * 1.25;

    // Background horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#647b9d';
    ctx.textAlign = 'right';

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      const val = maxVal - (maxVal / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillText(`₹${Math.round(val)}`, padding.left - 8, y + 3.5);
    }

    // Coordinates of data points
    const stepX = chartW / (labels.length - 1);
    const points = dataPoints.map((val, idx) => {
      const px = padding.left + idx * stepX;
      const py = padding.top + chartH - (val / maxVal) * chartH;
      return { x: px, y: py, val: val, label: labels[idx] };
    });

    // Draw Smooth Area Gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.35)'); // Antique Gold
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.00)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Smooth Line
    ctx.beginPath();
    ctx.strokeStyle = '#d4af37'; // Antique Gold
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Draw Glowing Points & X Labels
    ctx.textAlign = 'center';
    points.forEach(pt => {
      // Glow circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#101a2e';
      ctx.fill();
      ctx.strokeStyle = '#f7df8b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label below
      ctx.fillStyle = '#9cb1d1';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(pt.label, pt.x, h - padding.bottom + 18);

      // Tooltip/Value above point if > 0
      if (pt.val > 0) {
        ctx.fillStyle = '#f7df8b';
        ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
        ctx.fillText(`₹${Math.round(pt.val)}`, pt.x, pt.y - 9);
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    init,
    render,
    drawSalesChart
  };
})();

window.Dashboard = Dashboard;

// Reports Screen Controller
const Reports = (() => {
  let dom = {};

  function init() {
    cacheDom();
    render();
  }

  function cacheDom() {
    dom = {
      repTodaySales: document.getElementById('rep-today-sales'),
      repWeeklySales: document.getElementById('rep-weekly-sales'),
      repMonthlySales: document.getElementById('rep-monthly-sales'),
      repTotalBills: document.getElementById('rep-total-bills'),
      repAvgBill: document.getElementById('rep-avg-bill'),
      repTotalRevenue: document.getElementById('rep-total-revenue'),

      topProductsTbody: document.getElementById('rep-top-products-tbody'),
      paymentChartCanvas: document.getElementById('rep-payment-chart'),
      paymentBreakdownList: document.getElementById('rep-payment-list')
    };
  }

  function render() {
    const bills = DB.getBills();
    const currency = '₹';

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const mondayStr = monday.toISOString().split('T')[0];

    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Metrics
    const todayBills = bills.filter(b => b.date === todayStr);
    const weeklyBills = bills.filter(b => b.date >= mondayStr);
    const monthlyBills = bills.filter(b => b.date && b.date.startsWith(monthPrefix));

    const todaySales = todayBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const weeklySales = weeklyBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const monthlySales = monthlyBills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const totalRevenue = bills.reduce((s, b) => s + (Number(b.grandTotal) || 0), 0);
    const avgBill = bills.length > 0 ? (totalRevenue / bills.length) : 0;

    if (dom.repTodaySales) dom.repTodaySales.textContent = `${currency}${todaySales.toFixed(2)}`;
    if (dom.repWeeklySales) dom.repWeeklySales.textContent = `${currency}${weeklySales.toFixed(2)}`;
    if (dom.repMonthlySales) dom.repMonthlySales.textContent = `${currency}${monthlySales.toFixed(2)}`;
    if (dom.repTotalBills) dom.repTotalBills.textContent = bills.length.toString();
    if (dom.repAvgBill) dom.repAvgBill.textContent = `${currency}${avgBill.toFixed(2)}`;
    if (dom.repTotalRevenue) dom.repTotalRevenue.textContent = `${currency}${totalRevenue.toFixed(2)}`;

    renderTopProducts(bills);
    renderPaymentBreakdown(bills);
  }

  function renderTopProducts(bills) {
    if (!dom.topProductsTbody) return;

    // Aggregate product sales
    const productSalesMap = {};

    bills.forEach(b => {
      (b.items || []).forEach(item => {
        const key = item.productId || item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name,
            unit: item.unit || 'PCS',
            qtySold: 0,
            revenue: 0
          };
        }
        productSalesMap[key].qtySold += Number(item.qty) || 0;
        productSalesMap[key].revenue += Number(item.amount) || 0;
      });
    });

    const topList = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);

    const currency = '₹';

    if (topList.length === 0) {
      dom.topProductsTbody.innerHTML = `
        <tr><td colspan="4" class="text-center py-3 text-muted">No sales items yet</td></tr>
      `;
      return;
    }

    dom.topProductsTbody.innerHTML = topList.map((p, idx) => `
      <tr>
        <td class="col-rank">
          <span class="rank-badge ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}">${idx + 1}</span>
        </td>
        <td><strong>${p.name}</strong></td>
        <td><span class="qty-badge">${p.qtySold} ${p.unit}</span></td>
        <td class="text-right"><strong class="text-gold">${currency}${p.revenue.toFixed(2)}</strong></td>
      </tr>
    `).join('');
  }

  function renderPaymentBreakdown(bills) {
    const paymentMap = { Cash: 0, UPI: 0, Card: 0, Other: 0 };
    let totalAmt = 0;

    bills.forEach(b => {
      const mode = b.paymentMethod || 'Cash';
      const amt = Number(b.grandTotal) || 0;
      if (paymentMap[mode] !== undefined) {
        paymentMap[mode] += amt;
      } else {
        paymentMap['Other'] += amt;
      }
      totalAmt += amt;
    });

    const currency = '₹';

    if (dom.paymentBreakdownList) {
      dom.paymentBreakdownList.innerHTML = Object.entries(paymentMap).map(([mode, amt]) => {
        const pct = totalAmt > 0 ? ((amt / totalAmt) * 100).toFixed(1) : '0';
        return `
          <div class="pay-method-stat-card">
            <div class="pay-method-header">
              <span class="pay-method-name">${mode}</span>
              <span class="pay-method-pct">${pct}%</span>
            </div>
            <div class="pay-method-val">${currency}${amt.toFixed(2)}</div>
            <div class="pay-progress-bar">
              <div class="pay-progress-fill pay-fill-${mode.toLowerCase()}" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Draw Pure Canvas Donut Chart for Payment Methods
    drawPaymentDonut(paymentMap, totalAmt);
  }

  function drawPaymentDonut(paymentMap, totalAmt) {
    const canvas = dom.paymentChartCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 180;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 75;
    const innerRadius = 45;

    const colors = {
      Cash: '#10b981',  // Emerald
      UPI: '#d4af37',   // Gold
      Card: '#38bdf8',  // Sky Blue
      Other: '#a855f7'  // Purple
    };

    if (totalAmt === 0) {
      // Empty ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;

    Object.entries(paymentMap).forEach(([mode, amt]) => {
      if (amt <= 0) return;
      const sliceAngle = (amt / totalAmt) * (Math.PI * 2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[mode] || '#d4af37';
      ctx.fill();

      // Outer border
      ctx.strokeStyle = '#101a2e';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Center Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MODES', centerX, centerY - 6);
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#9cb1d1';
    ctx.fillText('100% Non-GST', centerX, centerY + 8);
  }

  return {
    init,
    render
  };
})();

window.Reports = Reports;
