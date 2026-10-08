/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * settings.js - Store Profile, POS Configuration, Backup & Restore
 * 
 * STRICT COMPLIANCE: ZERO GST / ZERO TAX SETTINGS.
 */

const SettingsManager = (() => {
  let dom = {};

  function init() {
    cacheDom();
    bindEvents();
    loadFormValues();
  }

  function cacheDom() {
    dom = {
      form: document.getElementById('settings-form'),
      inputStoreName: document.getElementById('set-store-name'),
      inputTagline: document.getElementById('set-tagline'),
      inputAddress: document.getElementById('set-address'),
      inputPhone: document.getElementById('set-phone'),
      inputWhatsapp: document.getElementById('set-whatsapp'),
      inputEmail: document.getElementById('set-email'),
      inputFooterMsg: document.getElementById('set-footer-msg'),

      inputPrefix: document.getElementById('set-invoice-prefix'),
      selectDefaultPayment: document.getElementById('set-default-payment'),
      selectReceiptFormat: document.getElementById('set-receipt-format'),
      toggleSound: document.getElementById('set-sound-enabled'),

      btnExportBackup: document.getElementById('btn-export-backup'),
      fileInputImport: document.getElementById('file-import-backup'),
      btnTriggerImport: document.getElementById('btn-trigger-import'),
      btnResetDemo: document.getElementById('btn-reset-demo')
    };
  }

  function bindEvents() {
    if (dom.form) {
      dom.form.addEventListener('submit', handleSaveSettings);
    }
    if (dom.btnExportBackup) {
      dom.btnExportBackup.addEventListener('click', handleExportBackup);
    }
    if (dom.btnTriggerImport && dom.fileInputImport) {
      dom.btnTriggerImport.addEventListener('click', () => {
        dom.fileInputImport.click();
      });
      dom.fileInputImport.addEventListener('change', handleImportBackup);
    }
    if (dom.btnResetDemo) {
      dom.btnResetDemo.addEventListener('click', handleResetDemo);
    }
  }

  function loadFormValues() {
    const s = DB.getSettings();
    if (!dom.form) return;

    if (dom.inputStoreName) dom.inputStoreName.value = s.storeName || 'Gupta Grocery Mart';
    if (dom.inputTagline) dom.inputTagline.value = s.tagline || 'Premium Grocery Store';
    if (dom.inputAddress) dom.inputAddress.value = s.address || '';
    if (dom.inputPhone) dom.inputPhone.value = s.phone || '';
    if (dom.inputWhatsapp) dom.inputWhatsapp.value = s.whatsapp || '';
    if (dom.inputEmail) dom.inputEmail.value = s.email || '';
    if (dom.inputFooterMsg) dom.inputFooterMsg.value = s.footerMessage || 'Thank You For Shopping With Us! Please Visit Again';

    if (dom.inputPrefix) dom.inputPrefix.value = s.invoicePrefix || 'GGM-';
    if (dom.selectDefaultPayment) dom.selectDefaultPayment.value = s.defaultPaymentMethod || 'Cash';
    if (dom.selectReceiptFormat) dom.selectReceiptFormat.value = s.receiptFormat || 'thermal';
    if (dom.toggleSound) dom.toggleSound.checked = s.soundEnabled !== false;

    // Update branding in header / sidebar
    updateStoreBranding(s);
  }

  function handleSaveSettings(e) {
    e.preventDefault();

    const newSettings = {
      storeName: dom.inputStoreName.value.trim() || 'Gupta Grocery Mart',
      tagline: dom.inputTagline.value.trim() || 'Premium Grocery Store',
      address: dom.inputAddress.value.trim(),
      phone: dom.inputPhone.value.trim(),
      whatsapp: dom.inputWhatsapp.value.trim(),
      email: dom.inputEmail.value.trim(),
      footerMessage: dom.inputFooterMsg.value.trim() || 'Thank You For Shopping With Us! Please Visit Again',
      invoicePrefix: (dom.inputPrefix.value.trim() || 'GGM-').toUpperCase(),
      defaultPaymentMethod: dom.selectDefaultPayment.value,
      receiptFormat: dom.selectReceiptFormat.value,
      soundEnabled: dom.toggleSound ? dom.toggleSound.checked : true
    };

    const updated = DB.saveSettings(newSettings);
    updateStoreBranding(updated);

    if (window.App && window.App.showToast) {
      window.App.showToast('✓ Settings updated successfully', 'success');
    }
  }

  function updateStoreBranding(settings) {
    const brandTitles = document.querySelectorAll('.dynamic-store-name');
    brandTitles.forEach(el => {
      el.textContent = settings.storeName || 'Gupta Grocery Mart';
    });

    const brandAddresses = document.querySelectorAll('.dynamic-store-address');
    brandAddresses.forEach(el => {
      el.textContent = settings.address || '';
    });

    const brandPhones = document.querySelectorAll('.dynamic-store-phone');
    brandPhones.forEach(el => {
      el.textContent = settings.phone || '';
    });
  }

  // Backup Export
  function handleExportBackup() {
    try {
      const jsonStr = DB.exportBackupData();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `GuptaGroceryMart_Backup_${dateStr}.json`;

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.App && window.App.showToast) {
        window.App.showToast(`Backup exported: ${filename}`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (window.App && window.App.showToast) {
        window.App.showToast('Failed to export backup data', 'danger');
      }
    }
  }

  // Backup Import
  function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const res = DB.importBackupData(content);

        if (res.success) {
          loadFormValues();
          if (window.Products) window.Products.render();
          if (window.Customers) window.Customers.render();
          if (window.Sales) window.Sales.render();
          if (window.Dashboard) window.Dashboard.render();
          if (window.Reports) window.Reports.render();
          if (window.POSBilling) window.POSBilling.resetBill();

          if (window.App && window.App.showToast) {
            window.App.showToast(`✓ Backup restored: ${res.countProducts} products, ${res.countBills} bills`, 'success');
          }
        } else {
          if (window.App && window.App.showToast) {
            window.App.showToast(`Import error: ${res.error}`, 'danger');
          }
        }
      } catch (err) {
        if (window.App && window.App.showToast) {
          window.App.showToast('Invalid backup JSON file', 'danger');
        }
      }
      e.target.value = '';
    };

    reader.readAsText(file);
  }

  // Reset to Demo Data
  function handleResetDemo() {
    window.App.showConfirmModal({
      title: 'Reset Demo Data?',
      message: 'This will reset products, sample customers, and demo bills to initial defaults. Current custom bills and products will be replaced.',
      confirmText: 'Yes, Reset to Demo',
      cancelText: 'Cancel',
      onConfirm: () => {
        DB.resetToDemo();
        loadFormValues();
        if (window.Products) window.Products.render();
        if (window.Customers) window.Customers.render();
        if (window.Sales) window.Sales.render();
        if (window.Dashboard) window.Dashboard.render();
        if (window.Reports) window.Reports.render();
        if (window.POSBilling) window.POSBilling.resetBill();

        window.App.showToast('Demo data restored successfully', 'info');
      }
    });
  }

  return {
    init,
    loadFormValues,
    updateStoreBranding
  };
})();

window.SettingsManager = SettingsManager;
