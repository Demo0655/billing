/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * customers.js - Customer Relationship & Purchase Tracking
 */

const Customers = (() => {
  let dom = {};
  let currentEditingCustomerId = null;

  function init() {
    cacheDom();
    bindEvents();
    render();
  }

  function cacheDom() {
    dom = {
      tableBody: document.getElementById('customers-tbody'),
      searchInput: document.getElementById('customers-search'),
      totalCountSpan: document.getElementById('customers-total-count'),
      btnAddCustomer: document.getElementById('btn-add-customer-modal'),

      // Modal
      modal: document.getElementById('customer-modal'),
      modalTitle: document.getElementById('customer-modal-title'),
      form: document.getElementById('customer-form'),
      inputName: document.getElementById('cust-modal-name'),
      inputPhone: document.getElementById('cust-modal-phone'),
      inputAddress: document.getElementById('cust-modal-address'),
      btnCancel: document.getElementById('btn-customer-cancel'),

      // Customer bills history modal
      historyModal: document.getElementById('customer-history-modal'),
      historyTitle: document.getElementById('customer-history-title'),
      historyBody: document.getElementById('customer-history-tbody'),
      btnCloseHistory: document.getElementById('btn-close-customer-history')
    };
  }

  function bindEvents() {
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', render);
    }
    if (dom.btnAddCustomer) {
      dom.btnAddCustomer.addEventListener('click', () => openModal(null));
    }
    if (dom.btnCancel) {
      dom.btnCancel.addEventListener('click', closeModal);
    }
    if (dom.form) {
      dom.form.addEventListener('submit', handleFormSubmit);
    }
    if (dom.btnCloseHistory) {
      dom.btnCloseHistory.addEventListener('click', closeHistoryModal);
    }

    if (dom.modal) {
      dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeModal();
      });
    }
    if (dom.historyModal) {
      dom.historyModal.addEventListener('click', (e) => {
        if (e.target === dom.historyModal) closeHistoryModal();
      });
    }
  }

  function render() {
    if (!dom.tableBody) return;

    let customers = DB.getCustomers();
    const query = dom.searchInput ? (dom.searchInput.value || '').toLowerCase().trim() : '';

    if (query) {
      customers = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query)) ||
        (c.address && c.address.toLowerCase().includes(query))
      );
    }

    if (dom.totalCountSpan) {
      dom.totalCountSpan.textContent = `${customers.length} registered`;
    }

    if (customers.length === 0) {
      dom.tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state-card">
              <span class="empty-icon">👥</span>
              <h3>No customers found</h3>
              <p>Customers are automatically saved when you bill them, or you can add them manually.</p>
              <button type="button" class="btn-royal-gold" onclick="Customers.openModal(null)">+ Add New Customer</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currency = '₹';
    dom.tableBody.innerHTML = customers.map((c, idx) => `
      <tr data-id="${c.id}">
        <td class="col-idx">${idx + 1}</td>
        <td class="col-name">
          <strong>${escapeHtml(c.name)}</strong>
        </td>
        <td class="col-phone">
          <span class="phone-badge">📞 ${escapeHtml(c.phone || 'N/A')}</span>
        </td>
        <td class="col-address">
          <span class="address-text">${escapeHtml(c.address || '—')}</span>
        </td>
        <td class="col-stats">
          <span class="badge-bills">${c.totalBills || 0} bills</span>
        </td>
        <td class="col-spend">
          <strong class="total-spend">${currency}${Number(c.totalPurchases || 0).toFixed(2)}</strong>
          <small class="last-date">Last: ${c.lastPurchase || '—'}</small>
        </td>
        <td class="col-actions">
          <div class="action-btn-group">
            <button type="button" class="btn-icon-action btn-view-history" data-id="${c.id}" title="View Past Invoices">
              📜
            </button>
            <button type="button" class="btn-icon-action btn-edit-customer" data-id="${c.id}" title="Edit Customer Details">
              ✏️
            </button>
            <button type="button" class="btn-icon-action btn-delete-customer" data-id="${c.id}" title="Delete Customer">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach row events
    dom.tableBody.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', () => {
        openHistoryModal(btn.dataset.id);
      });
    });

    dom.tableBody.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        openModal(btn.dataset.id);
      });
    });

    dom.tableBody.querySelectorAll('.btn-delete-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const cust = DB.getCustomers().find(c => c.id === btn.dataset.id);
        if (!cust) return;

        window.App.showConfirmModal({
          title: 'Delete Customer?',
          message: `Are you sure you want to delete customer record for "${cust.name}"? Past bills will remain in sales history.`,
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
          onConfirm: () => {
            DB.deleteCustomer(cust.id);
            render();
            if (window.Dashboard) window.Dashboard.render();
            window.App.showToast(`Customer ${cust.name} removed`, 'warning');
          }
        });
      });
    });
  }

  function openModal(customerId = null) {
    currentEditingCustomerId = customerId;
    if (dom.form) dom.form.reset();

    if (customerId) {
      const cust = DB.getCustomers().find(c => c.id === customerId);
      if (cust) {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Edit Customer';
        if (dom.inputName) dom.inputName.value = cust.name;
        if (dom.inputPhone) dom.inputPhone.value = cust.phone;
        if (dom.inputAddress) dom.inputAddress.value = cust.address || '';
      }
    } else {
      if (dom.modalTitle) dom.modalTitle.textContent = 'Add New Customer';
    }

    if (dom.modal) dom.modal.classList.remove('hidden');
    setTimeout(() => {
      if (dom.inputName) dom.inputName.focus();
    }, 100);
  }

  function closeModal() {
    if (dom.modal) dom.modal.classList.add('hidden');
    currentEditingCustomerId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = dom.inputName.value.trim();
    const phone = dom.inputPhone.value.trim();
    const address = dom.inputAddress.value.trim();

    if (!name) {
      window.App.showToast('Please enter customer name', 'warning');
      return;
    }

    const customerData = {
      id: currentEditingCustomerId || undefined,
      name,
      phone,
      address
    };

    DB.saveCustomer(customerData);
    closeModal();
    render();

    if (window.Dashboard) window.Dashboard.render();
    window.App.showToast(
      currentEditingCustomerId ? `Customer "${name}" updated` : `Customer "${name}" added`,
      'success'
    );
  }

  function openHistoryModal(customerId) {
    const cust = DB.getCustomers().find(c => c.id === customerId);
    if (!cust) return;

    if (dom.historyTitle) {
      dom.historyTitle.textContent = `Purchase History: ${cust.name} (${cust.phone || 'No phone'})`;
    }

    const allBills = DB.getBills();
    const custBills = allBills.filter(b => 
      (cust.phone && b.customerPhone && b.customerPhone.trim() === cust.phone.trim()) ||
      (b.customerName && b.customerName.trim().toLowerCase() === cust.name.trim().toLowerCase())
    );

    const currency = '₹';

    if (custBills.length === 0) {
      dom.historyBody.innerHTML = `
        <tr><td colspan="5" class="text-center py-4">No past invoices found for this customer.</td></tr>
      `;
    } else {
      dom.historyBody.innerHTML = custBills.map(b => `
        <tr>
          <td><strong>${b.billNo}</strong></td>
          <td>${b.date} ${b.time || ''}</td>
          <td>${b.items ? b.items.length : 0} items</td>
          <td><strong class="text-gold">${currency}${Number(b.grandTotal).toFixed(2)}</strong></td>
          <td>
            <button type="button" class="btn-royal-sm" onclick="Sales.viewBillDetail('${b.billNo}')">View Invoice</button>
          </td>
        </tr>
      `).join('');
    }

    if (dom.historyModal) dom.historyModal.classList.remove('hidden');
  }

  function closeHistoryModal() {
    if (dom.historyModal) dom.historyModal.classList.add('hidden');
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
    openModal,
    closeModal,
    openHistoryModal,
    closeHistoryModal
  };
})();

window.Customers = Customers;
