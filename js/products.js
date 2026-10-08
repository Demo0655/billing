/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * products.js - Product Catalog & Inventory Management
 * 
 * STRICT COMPLIANCE: ZERO GST / ZERO TAX FIELDS
 */

const Products = (() => {
  let dom = {};
  let currentEditingProductId = null;

  function init() {
    cacheDom();
    bindEvents();
    render();
  }

  function cacheDom() {
    dom = {
      tableBody: document.getElementById('products-tbody'),
      searchInput: document.getElementById('products-search'),
      categoryFilter: document.getElementById('products-category-filter'),
      stockFilter: document.getElementById('products-stock-filter'),
      btnAddProduct: document.getElementById('btn-add-product-modal'),
      totalCountSpan: document.getElementById('products-total-count'),

      // Modal elements
      modal: document.getElementById('product-modal'),
      modalTitle: document.getElementById('product-modal-title'),
      form: document.getElementById('product-form'),
      inputName: document.getElementById('prod-name'),
      inputCategory: document.getElementById('prod-category'),
      inputBarcode: document.getElementById('prod-barcode'),
      btnGenBarcode: document.getElementById('btn-gen-barcode'),
      inputUnit: document.getElementById('prod-unit'),
      inputPrice: document.getElementById('prod-price'),
      inputStock: document.getElementById('prod-stock'),
      btnCancel: document.getElementById('btn-product-cancel')
    };
  }

  function bindEvents() {
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', render);
    }
    if (dom.categoryFilter) {
      dom.categoryFilter.addEventListener('change', render);
    }
    if (dom.stockFilter) {
      dom.stockFilter.addEventListener('change', render);
    }
    if (dom.btnAddProduct) {
      dom.btnAddProduct.addEventListener('click', () => openModal(null));
    }
    if (dom.btnCancel) {
      dom.btnCancel.addEventListener('click', closeModal);
    }
    if (dom.btnGenBarcode) {
      dom.btnGenBarcode.addEventListener('click', () => {
        // Generate random EAN-13 style 13-digit code
        const code = '890' + Math.floor(1000000000 + Math.random() * 9000000000);
        if (dom.inputBarcode) dom.inputBarcode.value = code;
      });
    }
    if (dom.form) {
      dom.form.addEventListener('submit', handleFormSubmit);
    }

    // Modal background click
    if (dom.modal) {
      dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeModal();
      });
    }
  }

  function render() {
    if (!dom.tableBody) return;

    let products = DB.getProducts();
    const query = dom.searchInput ? (dom.searchInput.value || '').toLowerCase().trim() : '';
    const cat = dom.categoryFilter ? dom.categoryFilter.value : '';
    const stockStatus = dom.stockFilter ? dom.stockFilter.value : '';

    if (query) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    if (cat) {
      products = products.filter(p => p.category === cat);
    }

    if (stockStatus) {
      if (stockStatus === 'in_stock') {
        products = products.filter(p => p.stock > 10);
      } else if (stockStatus === 'low_stock') {
        products = products.filter(p => p.stock > 0 && p.stock <= 10);
      } else if (stockStatus === 'out_of_stock') {
        products = products.filter(p => p.stock <= 0);
      }
    }

    if (dom.totalCountSpan) {
      dom.totalCountSpan.textContent = `${products.length} products`;
    }

    if (products.length === 0) {
      dom.tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state-card">
              <span class="empty-icon">📦</span>
              <h3>No products found</h3>
              <p>Try clearing your search filters or click below to add a new grocery item.</p>
              <button type="button" class="btn-royal-gold" onclick="Products.openModal(null)">+ Add First Product</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const currency = '₹';
    dom.tableBody.innerHTML = products.map((p, idx) => {
      let statusBadge = '';
      if (p.stock <= 0) {
        statusBadge = '<span class="status-pill status-out">Out of Stock</span>';
      } else if (p.stock <= 10) {
        statusBadge = `<span class="status-pill status-low">Low Stock (${p.stock})</span>`;
      } else {
        statusBadge = '<span class="status-pill status-in">In Stock</span>';
      }

      return `
        <tr data-id="${p.id}">
          <td class="col-idx">${idx + 1}</td>
          <td class="col-name">
            <strong>${escapeHtml(p.name)}</strong>
          </td>
          <td class="col-category">
            <span class="badge-category">${escapeHtml(p.category || 'General')}</span>
          </td>
          <td class="col-barcode">
            <span class="barcode-display">${p.barcode ? escapeHtml(p.barcode) : '—'}</span>
          </td>
          <td class="col-unit">${escapeHtml(p.unit || 'PCS')}</td>
          <td class="col-price">
            <strong class="price-val">${currency}${Number(p.sellingPrice).toFixed(2)}</strong>
          </td>
          <td class="col-stock">
            <span class="stock-num ${p.stock <= 10 ? 'text-warning' : ''}">${p.stock}</span>
            ${statusBadge}
          </td>
          <td class="col-actions">
            <div class="action-btn-group">
              <button type="button" class="btn-icon-action btn-add-to-bill" data-id="${p.id}" title="Add to Active Bill">
                🛒
              </button>
              <button type="button" class="btn-icon-action btn-edit-product" data-id="${p.id}" title="Edit Product">
                ✏️
              </button>
              <button type="button" class="btn-icon-action btn-delete-product" data-id="${p.id}" title="Delete Product">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach actions
    dom.tableBody.querySelectorAll('.btn-add-to-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = DB.getProducts().find(item => item.id === btn.dataset.id);
        if (p) {
          POSBilling.addProductToBill(p);
          if (window.App) {
            window.App.navigateTo('billing');
            window.App.showToast(`Added ${p.name} to bill`, 'success');
          }
        }
      });
    });

    dom.tableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        openModal(btn.dataset.id);
      });
    });

    dom.tableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = DB.getProducts().find(item => item.id === btn.dataset.id);
        if (!prod) return;

        window.App.showConfirmModal({
          title: 'Delete Product?',
          message: `Are you sure you want to delete "${prod.name}"? This action cannot be reversed.`,
          confirmText: 'Yes, Delete',
          cancelText: 'Cancel',
          onConfirm: () => {
            DB.deleteProduct(prod.id);
            render();
            if (window.Dashboard) window.Dashboard.render();
            window.App.showToast(`Deleted ${prod.name}`, 'warning');
          }
        });
      });
    });
  }

  function openModal(productId = null) {
    currentEditingProductId = productId;
    if (dom.form) dom.form.reset();

    if (productId) {
      const prod = DB.getProducts().find(p => p.id === productId);
      if (prod) {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Edit Grocery Product';
        if (dom.inputName) dom.inputName.value = prod.name;
        if (dom.inputCategory) dom.inputCategory.value = prod.category;
        if (dom.inputBarcode) dom.inputBarcode.value = prod.barcode || '';
        if (dom.inputUnit) dom.inputUnit.value = prod.unit;
        if (dom.inputPrice) dom.inputPrice.value = prod.sellingPrice;
        if (dom.inputStock) dom.inputStock.value = prod.stock;
      }
    } else {
      if (dom.modalTitle) dom.modalTitle.textContent = 'Add New Grocery Product';
      if (dom.inputUnit) dom.inputUnit.value = 'PKT';
      if (dom.inputStock) dom.inputStock.value = '50';
    }

    if (dom.modal) dom.modal.classList.remove('hidden');
    setTimeout(() => {
      if (dom.inputName) dom.inputName.focus();
    }, 100);
  }

  function closeModal() {
    if (dom.modal) dom.modal.classList.add('hidden');
    currentEditingProductId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = dom.inputName.value.trim();
    const category = dom.inputCategory.value;
    const barcode = dom.inputBarcode.value.trim();
    const unit = dom.inputUnit.value;
    const sellingPrice = parseFloat(dom.inputPrice.value) || 0;
    const stock = parseFloat(dom.inputStock.value) || 0;

    if (!name) {
      window.App.showToast('Please enter a product name', 'warning');
      return;
    }

    if (sellingPrice < 0) {
      window.App.showToast('Selling price cannot be negative', 'warning');
      return;
    }

    const productData = {
      id: currentEditingProductId || undefined,
      name,
      category,
      barcode,
      unit,
      sellingPrice,
      stock
    };

    DB.saveProduct(productData);
    closeModal();
    render();

    if (window.Dashboard) window.Dashboard.render();

    window.App.showToast(
      currentEditingProductId ? `Product "${name}" updated` : `Product "${name}" added successfully!`,
      'success'
    );
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
    closeModal
  };
})();

window.Products = Products;
