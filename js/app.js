/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * app.js - Master Application Coordinator & Navigation Engine
 * 
 * Royal + Premium + Elegant Grocery POS Experience
 * STRICT ZERO GST COMPLIANCE THROUGHOUT THE APPLICATION.
 */

const App = (() => {
  let activeScreen = 'dashboard';
  let audioContext = null;

  // DOM Elements
  const dom = {};

  function init() {
    cacheDom();
    bindNavigation();
    initClock();
    bindKeyboardShortcuts();
    bindGlobalModals();

    // Initialize Subsystems
    if (window.DB) {
      // DB is initialized on load
    }
    if (window.POSBilling) window.POSBilling.init();
    if (window.Products) window.Products.init();
    if (window.Customers) window.Customers.init();
    if (window.Sales) window.Sales.init();
    if (window.Dashboard) window.Dashboard.init();
    if (window.Reports) window.Reports.init();
    if (window.SettingsManager) window.SettingsManager.init();

    // Default screen: New Bill or Dashboard
    navigateTo('dashboard');
  }

  function cacheDom() {
    dom.sidebar       = document.getElementById('sidebar');
    dom.sidebarToggle = document.getElementById('sidebar-toggle');
    dom.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    dom.navLinks      = document.querySelectorAll('.nav-link');
    dom.screenContainers = document.querySelectorAll('.app-screen');
    dom.pageTitle     = document.getElementById('page-title');

    dom.clockDate = document.getElementById('header-live-date');
    dom.clockTime = document.getElementById('header-live-time');

    dom.toastContainer = document.getElementById('toast-container');

    // Confirm Modal
    dom.confirmModal   = document.getElementById('confirm-modal');
    dom.confirmTitle   = document.getElementById('confirm-modal-title');
    dom.confirmMessage = document.getElementById('confirm-modal-message');
    dom.btnConfirmOk   = document.getElementById('btn-confirm-ok');
    dom.btnConfirmCancel = document.getElementById('btn-confirm-cancel');

    // Shortcuts Modal
    dom.btnHelpShortcuts = document.getElementById('btn-help-shortcuts');
    dom.shortcutsModal   = document.getElementById('shortcuts-modal');
    dom.btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

    // Dashboard New Bill Banner
    dom.btnDashboardNewBill = document.getElementById('btn-dashboard-new-bill');
  }

  // ── Mobile Sidebar Open / Close ──
  function openSidebar() {
    if (!dom.sidebar) return;
    dom.sidebar.classList.add('open');
    if (dom.sidebarBackdrop) {
      dom.sidebarBackdrop.style.display = 'block';
    }
  }

  function closeSidebar() {
    if (!dom.sidebar) return;
    dom.sidebar.classList.remove('open');
    if (dom.sidebarBackdrop) {
      dom.sidebarBackdrop.style.display = 'none';
    }
  }

  // Navigation System
  function bindNavigation() {
    // Nav links — navigate + close sidebar on mobile
    dom.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = link.dataset.screen;
        if (screen) {
          navigateTo(screen);
          if (window.innerWidth <= 900) closeSidebar();
        }
      });
    });

    // Hamburger button — toggle sidebar open/close
    if (dom.sidebarToggle) {
      dom.sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.sidebar && dom.sidebar.classList.contains('open')
          ? closeSidebar()
          : openSidebar();
      });
    }

    // Backdrop tap — close sidebar
    if (dom.sidebarBackdrop) {
      dom.sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    // Dashboard "New Bill" banner button
    if (dom.btnDashboardNewBill) {
      dom.btnDashboardNewBill.addEventListener('click', () => {
        navigateTo('billing');
      });
    }

    // Direct Quick-action buttons with data-navigate attribute
    document.querySelectorAll('[data-navigate]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo(btn.dataset.navigate);
      });
    });
  }

  function navigateTo(screenId) {
    activeScreen = screenId;

    // Update active nav link
    dom.navLinks.forEach(link => {
      if (link.dataset.screen === screenId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update screens
    dom.screenContainers.forEach(screen => {
      if (screen.id === `screen-${screenId}`) {
        screen.classList.add('active-screen');
      } else {
        screen.classList.remove('active-screen');
      }
    });

    // Update Header Title
    const titles = {
      dashboard: 'Dashboard',
      billing: 'New Bill (POS Terminal)',
      products: 'Products Management',
      customers: 'Customer Directory',
      sales: 'Sales History & Invoices',
      reports: 'Sales & Performance Reports',
      settings: 'Store Settings & Data Backup'
    };

    if (dom.pageTitle) {
      dom.pageTitle.textContent = titles[screenId] || 'Gupta Grocery Mart';
    }

    // Refresh data when navigating into screens
    if (screenId === 'dashboard' && window.Dashboard) {
      window.Dashboard.render();
    } else if (screenId === 'billing' && window.POSBilling) {
      window.POSBilling.focusSearch();
    } else if (screenId === 'products' && window.Products) {
      window.Products.render();
    } else if (screenId === 'customers' && window.Customers) {
      window.Customers.render();
    } else if (screenId === 'sales' && window.Sales) {
      window.Sales.render();
    } else if (screenId === 'reports' && window.Reports) {
      window.Reports.render();
    }
  }

  // Header Live Clock
  function initClock() {
    function update() {
      const now = new Date();
      
      const dateOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('en-IN', dateOptions);

      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      if (dom.clockDate) dom.clockDate.textContent = dateStr;
      if (dom.clockTime) dom.clockTime.textContent = timeStr;
    }

    update();
    setInterval(update, 1000);
  }

  // Keyboard Shortcuts (F1 - F6, ESC)
  function bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // F1 -> New Bill
      if (e.key === 'F1') {
        e.preventDefault();
        navigateTo('billing');
        showToast('POS Terminal (F1)', 'info', 1200);
        return;
      }

      // F2 -> Product Search
      if (e.key === 'F2') {
        e.preventDefault();
        navigateTo('billing');
        if (window.POSBilling) window.POSBilling.focusSearch();
        showToast('Focused Product Search (F2)', 'info', 1200);
        return;
      }

      // F3 -> Save Bill
      if (e.key === 'F3') {
        e.preventDefault();
        if (activeScreen === 'billing' && window.POSBilling) {
          window.POSBilling.handleSaveBill(false);
        }
        return;
      }

      // F4 -> Save & Print
      if (e.key === 'F4') {
        e.preventDefault();
        if (activeScreen === 'billing' && window.POSBilling) {
          window.POSBilling.handleSaveBill(true);
        }
        return;
      }

      // F5 -> Export PDF (Prevent Browser Reload!)
      if (e.key === 'F5') {
        e.preventDefault();
        if (activeScreen === 'billing' && window.POSBilling) {
          window.POSBilling.handleExportPdf();
        }
        return;
      }

      // F6 -> WhatsApp
      if (e.key === 'F6') {
        e.preventDefault();
        if (activeScreen === 'billing' && window.POSBilling) {
          window.POSBilling.handleWhatsappShare();
        }
        return;
      }

      // ESC -> Close active modals
      if (e.key === 'Escape') {
        closeAllModals();
        return;
      }

      // '?' key for shortcuts help (if not inside an input)
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        openShortcutsModal();
      }
    });
  }

  function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.classList.add('hidden'));
  }

  function openShortcutsModal() {
    if (dom.shortcutsModal) dom.shortcutsModal.classList.remove('hidden');
  }

  function bindGlobalModals() {
    if (dom.btnHelpShortcuts) {
      dom.btnHelpShortcuts.addEventListener('click', openShortcutsModal);
    }
    if (dom.btnCloseShortcuts) {
      dom.btnCloseShortcuts.addEventListener('click', () => {
        if (dom.shortcutsModal) dom.shortcutsModal.classList.add('hidden');
      });
    }
    if (dom.shortcutsModal) {
      dom.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === dom.shortcutsModal) dom.shortcutsModal.classList.add('hidden');
      });
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info', duration = 3000) {
    if (!dom.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `royal-toast toast-${type}`;

    const icons = {
      success: '✓',
      danger: '✕',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || '•'}</div>
      <div class="toast-msg">${message}</div>
      <button type="button" class="toast-close">&times;</button>
    `;

    dom.toastContainer.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 260);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }

  // Custom Confirmation Modal
  let pendingConfirmCallback = null;

  function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
    if (!dom.confirmModal) {
      if (confirm(message)) onConfirm && onConfirm();
      return;
    }

    if (dom.confirmTitle) dom.confirmTitle.textContent = title || 'Confirmation';
    if (dom.confirmMessage) dom.confirmMessage.textContent = message || 'Are you sure?';
    if (dom.btnConfirmOk) dom.btnConfirmOk.textContent = confirmText;
    if (dom.btnConfirmCancel) dom.btnConfirmCancel.textContent = cancelText;

    pendingConfirmCallback = onConfirm;

    dom.confirmModal.classList.remove('hidden');

    const handleOk = () => {
      dom.confirmModal.classList.add('hidden');
      cleanup();
      if (pendingConfirmCallback) pendingConfirmCallback();
    };

    const handleCancel = () => {
      dom.confirmModal.classList.add('hidden');
      cleanup();
    };

    const cleanup = () => {
      dom.btnConfirmOk.removeEventListener('click', handleOk);
      dom.btnConfirmCancel.removeEventListener('click', handleCancel);
      pendingConfirmCallback = null;
    };

    dom.btnConfirmOk.addEventListener('click', handleOk);
    dom.btnConfirmCancel.addEventListener('click', handleCancel);
  }

  // Synthesizer Audio Chimes via Web Audio API
  function playBeep(type = 'beep') {
    const s = DB.getSettings();
    if (s.soundEnabled === false) return;

    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioContext = new AudioCtx();
      }
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      if (type === 'beep') {
        // Crisp POS Scanner pip
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'barcode') {
        // Double fast pip
        [0, 0.07].forEach((delay, idx) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 0 ? 987 : 1318, now + delay);
          gain.gain.setValueAtTime(0.14, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.05);
        });
      } else if (type === 'success') {
        // Royal 3-tone chime for bill saved
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const delay = idx * 0.08;
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.15, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.25);
        });
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return {
    navigateTo,
    showToast,
    showConfirmModal,
    playBeep,
    getActiveScreen: () => activeScreen
  };
})();

window.App = App;
