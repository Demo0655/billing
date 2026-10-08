/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * sales.js - Sales History, Filtering, Invoice Details Modal & Reprint
 * 
 * STRICT COMPLIANCE: ZERO GST / ZERO TAX
 */

const Sales = (() => {
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    render();
  }

  function cacheDom() {
    dom = {
      tableBody: document.getElementById('sales-tbody'),
      searchInput: document.getElementById('sales-search'),
      filterPeriod: document.getElementById('sales-period-filter'),
      customDateWrapper: document.getElementById('sales-custom-date-wrap'),
      dateFrom: document.getElementById('sales-date-from'),
      dateTo: document.getElementById('sales-date-to'),
      totalCountBadge: document.getElementById('sales-total-count'),
      totalRevenueBadge: document.getElementById('sales-total-revenue'),

      // Bill Detail Modal
      modal: document.getElementById('bill-detail-modal'),
      modalContent: document.getElementById('bill-detail-content'),
      btnCloseModal: document.getElementById('btn-close-bill-detail'),
      btnPrintModal: document.getElementById('btn-modal-print'),
      btnPdfModal: document.getElementById('btn-modal-pdf'),
      btnWhatsappModal: document.getElementById('btn-modal-whatsapp')
    };
  }

  function bindEvents() {
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', render);
    }
    if (dom.filterPeriod) {
      dom.filterPeriod.addEventListener('change', () => {
        if (dom.filterPeriod.value === 'custom') {
          if (dom.customDateWrapper) dom.customDateWrapper.classList.remove('hidden');
        } else {
          if (dom.customDateWrapper) dom.customDateWrapper.classList.add('hidden');
        }
        render();
      });
    }
    if (dom.dateFrom) dom.dateFrom.addEventListener('change', render);
    if (dom.dateTo) dom.dateTo.addEventListener('change', render);

    if (dom.btnCloseModal) {
      dom.btnCloseModal.addEventListener('click', closeBillDetail);
    }
    if (dom.modal) {
      dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeBillDetail();
      });
    }
  }

  function filterBills(bills) {
    const period = dom.filterPeriod ? dom.filterPeriod.value : 'all';
    const query = dom.searchInput ? (dom.searchInput.value || '').toLowerCase().trim() : '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Calculate start of this week (Monday)
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const mondayStr = monday.toISOString().split('T')[0];

    // Start of this month
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    let filtered = bills.filter(b => {
      // Period filter
      if (period === 'today') {
        return b.date === todayStr;
      } else if (period === 'yesterday') {
        return b.date === yesterdayStr;
      } else if (period === 'week') {
        return b.date >= mondayStr;
      } else if (period === 'month') {
        return b.date >= monthStartStr;
      } else if (period === 'custom') {
        const from = dom.dateFrom ? dom.dateFrom.value : '';
        const to = dom.dateTo ? dom.dateTo.value : '';
        if (from && b.date < from) return false;
        if (to && b.date > to) return false;
        return true;
      }
      return true;
    });

    // Search query filter
    if (query) {
      filtered = filtered.filter(b => 
        (b.billNo && b.billNo.toLowerCase().includes(query)) ||
        (b.customerName && b.customerName.toLowerCase().includes(query)) ||
        (b.customerPhone && b.customerPhone.includes(query))
      );
    }

    return filtered;
  }

  function render() {
    if (!dom.tableBody) return;

    const allBills = DB.getBills();
    const bills = filterBills(allBills);
    const currency = '₹';

    const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);

    if (dom.totalCountBadge) {
      dom.totalCountBadge.textContent = `${bills.length} bills`;
    }
    if (dom.totalRevenueBadge) {
      dom.totalRevenueBadge.textContent = `${currency}${totalRevenue.toFixed(2)}`;
    }

    if (bills.length === 0) {
      dom.tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state-card">
              <span class="empty-icon">🧾</span>
              <h3>No bills generated yet</h3>
              <p>Invoices saved in the billing terminal will show up here.</p>
              <button type="button" class="btn-royal-gold" onclick="App.navigateTo('billing')">Create New Bill</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    dom.tableBody.innerHTML = bills.map((b, idx) => {
      const itemsCount = b.items ? b.items.length : 0;
      const paymentBadge = `<span class="badge-pay badge-pay-${(b.paymentMethod || 'cash').toLowerCase()}">${b.paymentMethod || 'Cash'}</span>`;

      return `
        <tr data-bill="${b.billNo}">
          <td class="col-bill-no">
            <strong class="text-gold bill-code">${b.billNo}</strong>
          </td>
          <td class="col-date">
            <span class="date-main">${b.date}</span>
            <small class="time-sub">${b.time || ''}</small>
          </td>
          <td class="col-customer">
            <span class="cust-name-text">${escapeHtml(b.customerName || 'Walk-in Customer')}</span>
            ${b.customerPhone ? `<small class="cust-phone-text">📞 ${escapeHtml(b.customerPhone)}</small>` : ''}
          </td>
          <td class="col-items">
            <span class="items-count-pill">${itemsCount} items</span>
          </td>
          <td class="col-amount">
            <strong class="bill-total-price">${currency}${Number(b.grandTotal).toFixed(2)}</strong>
            ${b.discount > 0 ? `<small class="discount-saved">Save: ${currency}${b.discount}</small>` : ''}
          </td>
          <td class="col-payment">${paymentBadge}</td>
          <td class="col-actions">
            <div class="action-btn-group">
              <button type="button" class="btn-icon-action btn-view-bill" data-bill="${b.billNo}" title="View Details">
                👁️
              </button>
              <button type="button" class="btn-icon-action btn-print-bill" data-bill="${b.billNo}" title="Print Receipt">
                🖨️
              </button>
              <button type="button" class="btn-icon-action btn-pdf-bill" data-bill="${b.billNo}" title="Export PDF">
                📄
              </button>
              <button type="button" class="btn-icon-action btn-wa-bill" data-bill="${b.billNo}" title="Share on WhatsApp">
                💬
              </button>
              <button type="button" class="btn-icon-action btn-del-bill" data-bill="${b.billNo}" title="Delete Bill">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    dom.tableBody.querySelectorAll('.btn-view-bill').forEach(btn => {
      btn.addEventListener('click', () => viewBillDetail(btn.dataset.bill));
    });

    dom.tableBody.querySelectorAll('.btn-print-bill').forEach(btn => {
      btn.addEventListener('click', () => reprintBill(btn.dataset.bill));
    });

    dom.tableBody.querySelectorAll('.btn-pdf-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = DB.getBillByNo(btn.dataset.bill);
        if (b) InvoicePDF.generate(b);
      });
    });

    dom.tableBody.querySelectorAll('.btn-wa-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = DB.getBillByNo(btn.dataset.bill);
        if (b) WhatsAppShare.share(b);
      });
    });

    dom.tableBody.querySelectorAll('.btn-del-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const billNo = btn.dataset.bill;
        window.App.showConfirmModal({
          title: 'Delete Bill Record?',
          message: `Are you sure you want to permanently delete bill "${billNo}"? This action cannot be reversed.`,
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
          onConfirm: () => {
            DB.deleteBill(billNo);
            render();
            if (window.Dashboard) window.Dashboard.render();
            if (window.Reports) window.Reports.render();
            window.App.showToast(`Bill ${billNo} deleted`, 'warning');
          }
        });
      });
    });
  }

  function viewBillDetail(billNo) {
    const bill = DB.getBillByNo(billNo);
    if (!bill || !dom.modalContent) return;

    const settings = DB.getSettings();
    const currency = settings.currencySymbol || '₹';

    const itemsRows = (bill.items || []).map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>${item.qty} ${escapeHtml(item.unit || '')}</td>
        <td>${currency}${Number(item.rate).toFixed(2)}</td>
        <td class="text-right"><strong>${currency}${Number(item.amount).toFixed(2)}</strong></td>
      </tr>
    `).join('');

    dom.modalContent.innerHTML = `
      <div class="invoice-preview-card">
        <div class="inv-header">
          <div class="inv-brand">
            <h2>${escapeHtml(settings.storeName)}</h2>
            <p>${escapeHtml(settings.tagline)}</p>
            <small>${escapeHtml(settings.address)} | Ph: ${escapeHtml(settings.phone)}</small>
          </div>
          <div class="inv-badge-wrap">
            <span class="inv-number-badge">${bill.billNo}</span>
          </div>
        </div>

        <div class="inv-meta-grid">
          <div><strong>Date:</strong> ${bill.date} ${bill.time || ''}</div>
          <div><strong>Payment:</strong> ${bill.paymentMethod || 'Cash'}</div>
          <div><strong>Customer:</strong> ${escapeHtml(bill.customerName || 'Walk-in Customer')}</div>
          <div><strong>Mobile:</strong> ${escapeHtml(bill.customerPhone || 'N/A')}</div>
        </div>

        <table class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="inv-totals-box">
          <div class="tot-row">
            <span>Subtotal:</span>
            <span>${currency}${Number(bill.subtotal).toFixed(2)}</span>
          </div>
          <div class="tot-row">
            <span>Discount:</span>
            <span>-${currency}${Number(bill.discount).toFixed(2)}</span>
          </div>
          <div class="tot-row grand-total-highlight">
            <span>GRAND TOTAL:</span>
            <span>${currency}${Number(bill.grandTotal).toFixed(2)}</span>
          </div>
          ${bill.amountReceived ? `
            <div class="tot-row sub-line">
              <span>Amount Received:</span>
              <span>${currency}${Number(bill.amountReceived).toFixed(2)}</span>
            </div>
            ${bill.change > 0 ? `
              <div class="tot-row sub-line">
                <span>Change Given:</span>
                <span>${currency}${Number(bill.change).toFixed(2)}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <div class="inv-footer-note">
          <p>${escapeHtml(settings.footerMessage)}</p>
        </div>
      </div>
    `;

    // Bind modal action buttons
    if (dom.btnPrintModal) {
      dom.btnPrintModal.onclick = () => reprintBill(bill.billNo);
    }
    if (dom.btnPdfModal) {
      dom.btnPdfModal.onclick = () => InvoicePDF.generate(bill);
    }
    if (dom.btnWhatsappModal) {
      dom.btnWhatsappModal.onclick = () => WhatsAppShare.share(bill);
    }

    if (dom.modal) dom.modal.classList.remove('hidden');
  }

  function closeBillDetail() {
    if (dom.modal) dom.modal.classList.add('hidden');
  }

  function reprintBill(billNo) {
    const bill = DB.getBillByNo(billNo);
    if (!bill) return;

    POSBilling.preparePrintInvoice(bill);
    setTimeout(() => {
      window.print();
    }, 200);
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
    viewBillDetail,
    reprintBill
  };
})();

window.Sales = Sales;
