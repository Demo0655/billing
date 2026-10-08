/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * billing.js - Core POS Terminal Engine
 * 
 * STRICT COMPLIANCE: ZERO GST / ZERO TAX CALCULATION.
 * Formula:
 * Item Amount = Qty × Rate
 * Subtotal = Sum(Item Amount)
 * Grand Total = Subtotal - Discount
 * Change = Amount Received - Grand Total
 */

const POSBilling = (() => {
  // Current active bill state
  let currentBill = {
    billNo: '',
    date: '',
    time: '',
    customerName: '',
    customerPhone: '',
    items: [],
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
    paymentMethod: 'Cash',
    amountReceived: '',
    change: 0,
    notes: ''
  };

  let selectedSuggestionIndex = -1;
  let searchResults = [];

  // DOM Elements cache
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    resetBill();
  }

  function cacheDom() {
    dom = {
      billNoInput: document.getElementById('bill-no'),
      billDateInput: document.getElementById('bill-date'),
      billTimeInput: document.getElementById('bill-time'),
      custNameInput: document.getElementById('cust-name'),
      custPhoneInput: document.getElementById('cust-phone'),
      custSuggestions: document.getElementById('cust-suggestions'),

      searchInput: document.getElementById('pos-search-input'),
      searchDropdown: document.getElementById('pos-search-dropdown'),
      quickPicksContainer: document.getElementById('quick-picks-container'),

      itemsTableBody: document.getElementById('pos-items-tbody'),
      emptyCartRow: document.getElementById('pos-empty-cart'),
      itemCountBadge: document.getElementById('pos-item-count-badge'),

      subtotalDisplay: document.getElementById('summary-subtotal'),
      discountInput: document.getElementById('summary-discount'),
      grandTotalDisplay: document.getElementById('summary-grand-total'),
      paymentMethodSelect: document.getElementById('summary-payment-method'),
      amountReceivedInput: document.getElementById('summary-amount-received'),
      changeRow: document.getElementById('summary-change-row'),
      changeLabel: document.getElementById('summary-change-label'),
      changeDisplay: document.getElementById('summary-change-amount'),

      btnSaveBill: document.getElementById('btn-save-bill'),
      btnSavePrint: document.getElementById('btn-save-print'),
      btnExportPdf: document.getElementById('btn-export-pdf'),
      btnWhatsapp: document.getElementById('btn-whatsapp'),
      btnClearBill: document.getElementById('btn-clear-bill'),

      printableInvoice: document.getElementById('printable-invoice-container')
    };
  }

  function bindEvents() {
    if (!dom.searchInput) return;

    // Search input typing & barcode detection
    dom.searchInput.addEventListener('input', handleSearchInput);
    dom.searchInput.addEventListener('keydown', handleSearchKeydown);

    // Document click to close search dropdown
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#pos-search-wrapper')) {
        hideSearchDropdown();
      }
      if (!e.target.closest('#cust-autocomplete-wrapper')) {
        hideCustomerDropdown();
      }
    });

    // Customer suggestions
    if (dom.custPhoneInput) {
      dom.custPhoneInput.addEventListener('input', handleCustomerSearch);
    }
    if (dom.custNameInput) {
      dom.custNameInput.addEventListener('input', handleCustomerSearch);
    }

    // Discount change
    if (dom.discountInput) {
      dom.discountInput.addEventListener('input', () => {
        currentBill.discount = Math.max(0, parseFloat(dom.discountInput.value) || 0);
        calculateTotals();
      });
    }

    // Payment method
    if (dom.paymentMethodSelect) {
      dom.paymentMethodSelect.addEventListener('change', () => {
        currentBill.paymentMethod = dom.paymentMethodSelect.value;
      });
    }

    // Amount received change
    if (dom.amountReceivedInput) {
      dom.amountReceivedInput.addEventListener('input', () => {
        currentBill.amountReceived = dom.amountReceivedInput.value;
        calculateChange();
      });
    }

    // POS Action Buttons
    if (dom.btnSaveBill) dom.btnSaveBill.addEventListener('click', () => handleSaveBill(false));
    if (dom.btnSavePrint) dom.btnSavePrint.addEventListener('click', () => handleSaveBill(true));
    if (dom.btnExportPdf) dom.btnExportPdf.addEventListener('click', handleExportPdf);
    if (dom.btnWhatsapp) dom.btnWhatsapp.addEventListener('click', handleWhatsappShare);
    if (dom.btnClearBill) dom.btnClearBill.addEventListener('click', handleClearPrompt);

    // Discount preset chips
    const discountPillButtons = document.querySelectorAll('.discount-pill');
    discountPillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.discount || 0);
        dom.discountInput.value = val;
        currentBill.discount = val;
        calculateTotals();
      });
    });

    // Render Quick Pick staples
    renderQuickPicks();
  }

  function resetBill() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const settings = DB.getSettings();

    currentBill = {
      billNo: DB.getNextBillNo(),
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      customerName: '',
      customerPhone: '',
      items: [],
      subtotal: 0,
      discount: 0,
      grandTotal: 0,
      paymentMethod: settings.defaultPaymentMethod || 'Cash',
      amountReceived: '',
      change: 0,
      notes: ''
    };

    if (dom.billNoInput) dom.billNoInput.value = currentBill.billNo;
    if (dom.billDateInput) dom.billDateInput.value = currentBill.date;
    if (dom.billTimeInput) dom.billTimeInput.value = currentBill.time;
    if (dom.custNameInput) dom.custNameInput.value = '';
    if (dom.custPhoneInput) dom.custPhoneInput.value = '';
    if (dom.discountInput) dom.discountInput.value = '0';
    if (dom.amountReceivedInput) dom.amountReceivedInput.value = '';
    if (dom.paymentMethodSelect) dom.paymentMethodSelect.value = currentBill.paymentMethod;

    renderItemsTable();
    calculateTotals();
    
    // Focus search input for lightning-fast scanning
    setTimeout(() => {
      if (dom.searchInput) dom.searchInput.focus();
    }, 150);
  }

  function renderQuickPicks() {
    if (!dom.quickPicksContainer) return;
    const products = DB.getProducts();
    // Select popular items
    const quickItems = products.slice(0, 8);

    dom.quickPicksContainer.innerHTML = quickItems.map(p => `
      <button type="button" class="quick-pick-btn" data-id="${p.id}" title="${p.name} - ₹${p.sellingPrice}">
        <span class="quick-pick-name">${escapeHtml(p.name)}</span>
        <span class="quick-pick-price">₹${Number(p.sellingPrice).toFixed(0)}</span>
      </button>
    `).join('');

    dom.quickPicksContainer.querySelectorAll('.quick-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prodId = btn.dataset.id;
        const prod = products.find(p => p.id === prodId);
        if (prod) {
          addProductToBill(prod);
          if (window.App && window.App.playBeep) window.App.playBeep('beep');
        }
      });
    });
  }

  // Barcode and live search handling
  function handleSearchInput(e) {
    const query = dom.searchInput.value.trim().toLowerCase();
    if (!query) {
      hideSearchDropdown();
      return;
    }

    const products = DB.getProducts();
    searchResults = products.filter(p => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchBarcode = p.barcode && p.barcode.toLowerCase().includes(query);
      const matchCategory = p.category && p.category.toLowerCase().includes(query);
      return matchName || matchBarcode || matchCategory;
    }).slice(0, 8);

    if (searchResults.length > 0) {
      renderSearchDropdown(searchResults);
    } else {
      dom.searchDropdown.innerHTML = `<div class="search-no-result">No product found for "<strong>${escapeHtml(query)}</strong>"</div>`;
      dom.searchDropdown.classList.remove('hidden');
    }
  }

  function handleSearchKeydown(e) {
    // Check if Barcode Scanner entered a complete barcode with Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = dom.searchInput.value.trim();
      if (!query) return;

      const products = DB.getProducts();

      // 1. Exact Barcode Match
      const exactBarcodeProd = products.find(p => p.barcode && p.barcode.trim().toLowerCase() === query.toLowerCase());
      if (exactBarcodeProd) {
        addProductToBill(exactBarcodeProd);
        if (window.App && window.App.playBeep) window.App.playBeep('barcode');
        dom.searchInput.value = '';
        hideSearchDropdown();
        return;
      }

      // 2. Exact Name Match
      const exactNameProd = products.find(p => p.name.trim().toLowerCase() === query.toLowerCase());
      if (exactNameProd) {
        addProductToBill(exactNameProd);
        if (window.App && window.App.playBeep) window.App.playBeep('beep');
        dom.searchInput.value = '';
        hideSearchDropdown();
        return;
      }

      // 3. Highlighted dropdown item
      if (selectedSuggestionIndex >= 0 && searchResults[selectedSuggestionIndex]) {
        addProductToBill(searchResults[selectedSuggestionIndex]);
        if (window.App && window.App.playBeep) window.App.playBeep('beep');
        dom.searchInput.value = '';
        hideSearchDropdown();
        return;
      }

      // 4. If search results exist, pick first
      if (searchResults.length > 0) {
        addProductToBill(searchResults[0]);
        if (window.App && window.App.playBeep) window.App.playBeep('beep');
        dom.searchInput.value = '';
        hideSearchDropdown();
        return;
      }

      // Not found
      if (window.App && window.App.showToast) {
        window.App.showToast(`Product/Barcode "${query}" not found`, 'warning');
      }
      return;
    }

    // Keyboard navigation in search dropdown
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % searchResults.length;
        updateSelectedSuggestion();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        selectedSuggestionIndex = (selectedSuggestionIndex - 1 + searchResults.length) % searchResults.length;
        updateSelectedSuggestion();
      }
    } else if (e.key === 'Escape') {
      hideSearchDropdown();
    }
  }

  function renderSearchDropdown(items) {
    selectedSuggestionIndex = 0;
    const currency = '₹';

    dom.searchDropdown.innerHTML = items.map((p, idx) => `
      <div class="search-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" data-id="${p.id}">
        <div class="search-item-info">
          <span class="search-item-name">${escapeHtml(p.name)}</span>
          <span class="search-item-sub">
            <span class="badge-category">${escapeHtml(p.category || 'General')}</span>
            ${p.barcode ? `<span class="barcode-tag">🔖 ${escapeHtml(p.barcode)}</span>` : ''}
            <span class="stock-tag ${p.stock <= 5 ? 'stock-low' : ''}">Stock: ${p.stock} ${p.unit}</span>
          </span>
        </div>
        <div class="search-item-price">${currency}${Number(p.sellingPrice).toFixed(2)}</div>
      </div>
    `).join('');

    dom.searchDropdown.classList.remove('hidden');

    // Click handler for search items
    dom.searchDropdown.querySelectorAll('.search-item').forEach(itemElem => {
      itemElem.addEventListener('click', () => {
        const idx = parseInt(itemElem.dataset.index, 10);
        if (searchResults[idx]) {
          addProductToBill(searchResults[idx]);
          if (window.App && window.App.playBeep) window.App.playBeep('beep');
          dom.searchInput.value = '';
          hideSearchDropdown();
          dom.searchInput.focus();
        }
      });
    });
  }

  function updateSelectedSuggestion() {
    const items = dom.searchDropdown.querySelectorAll('.search-item');
    items.forEach((item, idx) => {
      if (idx === selectedSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  function hideSearchDropdown() {
    if (dom.searchDropdown) {
      dom.searchDropdown.classList.add('hidden');
      dom.searchDropdown.innerHTML = '';
      selectedSuggestionIndex = -1;
      searchResults = [];
    }
  }

  // Customer search & autocomplete
  function handleCustomerSearch() {
    const phoneQuery = (dom.custPhoneInput.value || '').trim();
    const nameQuery = (dom.custNameInput.value || '').trim().toLowerCase();

    if (!phoneQuery && !nameQuery) {
      hideCustomerDropdown();
      return;
    }

    const customers = DB.getCustomers();
    const matches = customers.filter(c => {
      const pMatch = phoneQuery && c.phone && c.phone.includes(phoneQuery);
      const nMatch = nameQuery && c.name && c.name.toLowerCase().includes(nameQuery);
      return pMatch || nMatch;
    }).slice(0, 4);

    if (matches.length > 0 && dom.custSuggestions) {
      dom.custSuggestions.innerHTML = matches.map(c => `
        <div class="cust-suggest-item" data-name="${escapeHtml(c.name)}" data-phone="${escapeHtml(c.phone)}">
          <strong>${escapeHtml(c.name)}</strong> • <span>${escapeHtml(c.phone)}</span>
          <small>(${c.totalBills} bills • Total: ₹${c.totalPurchases})</small>
        </div>
      `).join('');

      dom.custSuggestions.classList.remove('hidden');

      dom.custSuggestions.querySelectorAll('.cust-suggest-item').forEach(el => {
        el.addEventListener('click', () => {
          dom.custNameInput.value = el.dataset.name;
          dom.custPhoneInput.value = el.dataset.phone;
          hideCustomerDropdown();
        });
      });
    } else {
      hideCustomerDropdown();
    }
  }

  function hideCustomerDropdown() {
    if (dom.custSuggestions) {
      dom.custSuggestions.classList.add('hidden');
      dom.custSuggestions.innerHTML = '';
    }
  }

  // Add product to bill (or increment qty if already added)
  function addProductToBill(product) {
    if (!product) return;

    const existingIndex = currentBill.items.findIndex(item => item.productId === product.id);

    if (existingIndex !== -1) {
      // Increment quantity
      currentBill.items[existingIndex].qty += 1;
      currentBill.items[existingIndex].amount = currentBill.items[existingIndex].qty * currentBill.items[existingIndex].rate;
    } else {
      // Add new row
      currentBill.items.push({
        productId: product.id,
        name: product.name,
        barcode: product.barcode || '',
        unit: product.unit || 'PCS',
        rate: Number(product.sellingPrice) || 0,
        qty: 1,
        amount: Number(product.sellingPrice) || 0
      });
    }

    renderItemsTable();
    calculateTotals();

    if (window.App && window.App.showToast) {
      window.App.showToast(`Added: ${product.name}`, 'info', 1600);
    }
  }

  // Render Table Rows
  function renderItemsTable() {
    if (!dom.itemsTableBody) return;

    if (currentBill.items.length === 0) {
      dom.itemsTableBody.innerHTML = `
        <tr class="empty-table-row">
          <td colspan="7">
            <div class="empty-cart-state">
              <div class="empty-icon">🛒</div>
              <h4>Billing Cart is Empty</h4>
              <p>Type product name above, scan barcode, or select from quick picks.</p>
              <span class="hint-text">Press <strong>F2</strong> to search • Scan USB barcode scanner anytime</span>
            </div>
          </td>
        </tr>
      `;
      if (dom.itemCountBadge) dom.itemCountBadge.textContent = '0 items';
      return;
    }

    const currency = '₹';
    dom.itemsTableBody.innerHTML = currentBill.items.map((item, idx) => `
      <tr class="pos-item-row" data-index="${idx}">
        <td class="col-index">${idx + 1}</td>
        <td class="col-product">
          <span class="item-name">${escapeHtml(item.name)}</span>
          ${item.barcode ? `<small class="item-barcode">Code: ${escapeHtml(item.barcode)}</small>` : ''}
        </td>
        <td class="col-qty">
          <div class="qty-control-box">
            <button type="button" class="btn-qty btn-qty-minus" data-index="${idx}">−</button>
            <input type="number" min="1" step="any" class="input-qty" data-index="${idx}" value="${item.qty}">
            <button type="button" class="btn-qty btn-qty-plus" data-index="${idx}">+</button>
          </div>
        </td>
        <td class="col-unit">
          <span class="unit-badge">${escapeHtml(item.unit)}</span>
        </td>
        <td class="col-rate">
          <div class="rate-input-wrap">
            <span class="currency-prefix">${currency}</span>
            <input type="number" min="0" step="any" class="input-rate" data-index="${idx}" value="${item.rate}">
          </div>
        </td>
        <td class="col-amount">
          <strong class="item-total-display">${currency}${Number(item.amount).toFixed(2)}</strong>
        </td>
        <td class="col-action">
          <button type="button" class="btn-delete-row" data-index="${idx}" title="Remove item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    if (dom.itemCountBadge) {
      const totalUnits = currentBill.items.reduce((s, i) => s + Number(i.qty), 0);
      dom.itemCountBadge.textContent = `${currentBill.items.length} items (${totalUnits} units)`;
    }

    // Attach row events
    dom.itemsTableBody.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (currentBill.items[idx]) {
          if (currentBill.items[idx].qty > 1) {
            currentBill.items[idx].qty -= 1;
            currentBill.items[idx].amount = currentBill.items[idx].qty * currentBill.items[idx].rate;
          } else {
            currentBill.items.splice(idx, 1);
          }
          renderItemsTable();
          calculateTotals();
        }
      });
    });

    dom.itemsTableBody.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (currentBill.items[idx]) {
          currentBill.items[idx].qty += 1;
          currentBill.items[idx].amount = currentBill.items[idx].qty * currentBill.items[idx].rate;
          renderItemsTable();
          calculateTotals();
        }
      });
    });

    dom.itemsTableBody.querySelectorAll('.input-qty').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.index, 10);
        const val = parseFloat(input.value);
        if (currentBill.items[idx]) {
          if (val > 0) {
            currentBill.items[idx].qty = val;
          } else {
            currentBill.items.splice(idx, 1);
          }
          currentBill.items[idx] && (currentBill.items[idx].amount = currentBill.items[idx].qty * currentBill.items[idx].rate);
          renderItemsTable();
          calculateTotals();
        }
      });
    });

    dom.itemsTableBody.querySelectorAll('.input-rate').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.index, 10);
        const val = Math.max(0, parseFloat(input.value) || 0);
        if (currentBill.items[idx]) {
          currentBill.items[idx].rate = val;
          currentBill.items[idx].amount = currentBill.items[idx].qty * val;
          renderItemsTable();
          calculateTotals();
        }
      });
    });

    dom.itemsTableBody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (currentBill.items[idx]) {
          const removedName = currentBill.items[idx].name;
          currentBill.items.splice(idx, 1);
          renderItemsTable();
          calculateTotals();
          if (window.App && window.App.showToast) {
            window.App.showToast(`Removed: ${removedName}`, 'warning', 1500);
          }
        }
      });
    });
  }

  // Calculate Subtotal, Grand Total, and Change
  function calculateTotals() {
    const currency = '₹';

    // Subtotal = Sum of all item amounts (Item Price × Quantity)
    currentBill.subtotal = currentBill.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Grand Total = Subtotal - Discount (Strict Zero GST)
    currentBill.grandTotal = Math.max(0, currentBill.subtotal - currentBill.discount);

    if (dom.subtotalDisplay) {
      dom.subtotalDisplay.textContent = `${currency}${currentBill.subtotal.toFixed(2)}`;
    }
    if (dom.grandTotalDisplay) {
      dom.grandTotalDisplay.textContent = `${currency}${currentBill.grandTotal.toFixed(2)}`;
    }

    calculateChange();
  }

  function calculateChange() {
    const currency = '₹';
    const receivedVal = parseFloat(currentBill.amountReceived);

    if (isNaN(receivedVal) || receivedVal <= 0) {
      currentBill.change = 0;
      if (dom.changeRow) dom.changeRow.classList.add('hidden');
      return;
    }

    if (dom.changeRow) dom.changeRow.classList.remove('hidden');

    if (receivedVal >= currentBill.grandTotal) {
      const changeAmount = receivedVal - currentBill.grandTotal;
      currentBill.change = changeAmount;
      if (dom.changeLabel) dom.changeLabel.textContent = 'Change to Return:';
      if (dom.changeDisplay) {
        dom.changeDisplay.textContent = `${currency}${changeAmount.toFixed(2)}`;
        dom.changeDisplay.className = 'change-amount-display change-positive';
      }
    } else {
      const balanceDue = currentBill.grandTotal - receivedVal;
      currentBill.change = 0;
      if (dom.changeLabel) dom.changeLabel.textContent = 'Balance Due:';
      if (dom.changeDisplay) {
        dom.changeDisplay.textContent = `${currency}${balanceDue.toFixed(2)}`;
        dom.changeDisplay.className = 'change-amount-display change-due';
      }
    }
  }

  // Prepare Printable Invoice HTML inside #printable-invoice-container
  function preparePrintInvoice(billData) {
    if (!dom.printableInvoice) return;
    const settings = DB.getSettings();
    const currency = settings.currencySymbol || '₹';

    const itemsHtml = (billData.items || []).map((item, idx) => `
      <tr>
        <td class="print-idx">${idx + 1}</td>
        <td class="print-desc">${escapeHtml(item.name)}</td>
        <td class="print-qty">${item.qty} ${escapeHtml(item.unit || '')}</td>
        <td class="print-rate">${currency}${Number(item.rate).toFixed(2)}</td>
        <td class="print-amount">${currency}${Number(item.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    dom.printableInvoice.innerHTML = `
      <div class="print-invoice-wrapper ${settings.receiptFormat === 'thermal' ? 'format-thermal' : 'format-standard'}">
        <div class="print-header">
          <div class="print-logo-emblem">👑</div>
          <h1 class="print-store-title">${escapeHtml(settings.storeName || 'GUPTA GROCERY MART')}</h1>
          <p class="print-tagline">${escapeHtml(settings.tagline || 'Premium Grocery Store')}</p>
          <p class="print-address">${escapeHtml(settings.address || '')}</p>
          <p class="print-contact">Phone: ${escapeHtml(settings.phone || '')} | WhatsApp: ${escapeHtml(settings.whatsapp || '')}</p>
        </div>

        <div class="print-meta-divider"></div>

        <div class="print-meta-grid">
          <div class="print-meta-left">
            <div><strong>Bill No:</strong> ${escapeHtml(billData.billNo)}</div>
            <div><strong>Date:</strong> ${escapeHtml(billData.date)}</div>
            <div><strong>Time:</strong> ${escapeHtml(billData.time)}</div>
          </div>
          <div class="print-meta-right">
            <div><strong>Customer:</strong> ${escapeHtml(billData.customerName || 'Walk-in Customer')}</div>
            ${billData.customerPhone ? `<div><strong>Mobile:</strong> ${escapeHtml(billData.customerPhone)}</div>` : ''}
            <div><strong>Payment:</strong> ${escapeHtml(billData.paymentMethod || 'Cash')}</div>
          </div>
        </div>

        <table class="print-items-table">
          <thead>
            <tr>
              <th class="print-idx">#</th>
              <th class="print-desc">Item Description</th>
              <th class="print-qty">Qty</th>
              <th class="print-rate">Rate</th>
              <th class="print-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="print-summary-section">
          <div class="print-summary-row">
            <span>Subtotal:</span>
            <span>${currency}${Number(billData.subtotal).toFixed(2)}</span>
          </div>
          <div class="print-summary-row">
            <span>Discount:</span>
            <span>-${currency}${Number(billData.discount).toFixed(2)}</span>
          </div>
          <div class="print-summary-divider"></div>
          <div class="print-grand-total-row">
            <span>GRAND TOTAL:</span>
            <span>${currency}${Number(billData.grandTotal).toFixed(2)}</span>
          </div>
          ${billData.amountReceived ? `
            <div class="print-summary-row" style="margin-top:4px;">
              <span>Amount Received:</span>
              <span>${currency}${Number(billData.amountReceived).toFixed(2)}</span>
            </div>
            ${billData.change > 0 ? `
              <div class="print-summary-row">
                <span>Change Returned:</span>
                <span>${currency}${Number(billData.change).toFixed(2)}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <div class="print-footer">
          <div class="print-footer-rule"></div>
          <p class="print-footer-msg">${escapeHtml(settings.footerMessage || 'Thank You For Shopping With Us! Please Visit Again')}</p>
          <p class="print-sub-msg">Save Paper • Shop Fresh • Pure Quality</p>
        </div>
      </div>
    `;
  }

  // Save Bill Action
  function handleSaveBill(andPrint = false) {
    if (currentBill.items.length === 0) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Cannot save an empty bill. Please add products first.', 'warning');
      }
      return;
    }

    // Capture customer fields
    currentBill.customerName = dom.custNameInput ? dom.custNameInput.value.trim() : '';
    currentBill.customerPhone = dom.custPhoneInput ? dom.custPhoneInput.value.trim() : '';

    // Save in DB
    const saved = DB.saveBill({ ...currentBill });

    if (window.App && window.App.playBeep) {
      window.App.playBeep('success');
    }

    if (window.App && window.App.showToast) {
      window.App.showToast(`✓ Bill ${saved.billNo} saved successfully!`, 'success');
    }

    // Prepare print preview
    preparePrintInvoice(saved);

    if (andPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }

    // Refresh other screens if they exist
    if (window.Sales) window.Sales.render();
    if (window.Dashboard) window.Dashboard.render();
    if (window.Products) window.Products.render();
    if (window.Customers) window.Customers.render();

    // Reset for next bill
    resetBill();
  }

  function handleExportPdf() {
    if (currentBill.items.length === 0) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please add items to bill before exporting PDF.', 'warning');
      }
      return;
    }
    currentBill.customerName = dom.custNameInput ? dom.custNameInput.value.trim() : '';
    currentBill.customerPhone = dom.custPhoneInput ? dom.custPhoneInput.value.trim() : '';

    InvoicePDF.generate(currentBill);
  }

  function handleWhatsappShare() {
    if (currentBill.items.length === 0) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please add items to bill before sharing on WhatsApp.', 'warning');
      }
      return;
    }
    currentBill.customerName = dom.custNameInput ? dom.custNameInput.value.trim() : '';
    currentBill.customerPhone = dom.custPhoneInput ? dom.custPhoneInput.value.trim() : '';

    WhatsAppShare.share(currentBill);
  }

  function handleClearPrompt() {
    if (currentBill.items.length === 0) {
      resetBill();
      return;
    }

    if (window.App && window.App.showConfirmModal) {
      window.App.showConfirmModal({
        title: 'Clear Current Bill?',
        message: 'Are you sure you want to discard all items in this bill? This cannot be undone.',
        confirmText: 'Yes, Clear Bill',
        cancelText: 'Cancel',
        onConfirm: () => {
          resetBill();
          if (window.App && window.App.showToast) {
            window.App.showToast('Bill cleared', 'info');
          }
        }
      });
    } else {
      if (confirm('Clear current bill?')) resetBill();
    }
  }

  // Utility to prevent XSS
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
    resetBill,
    addProductToBill,
    handleSaveBill,
    handleExportPdf,
    handleWhatsappShare,
    handleClearPrompt,
    preparePrintInvoice,
    getCurrentBill: () => currentBill,
    focusSearch: () => {
      if (dom.searchInput) dom.searchInput.focus();
    }
  };
})();

window.POSBilling = POSBilling;
