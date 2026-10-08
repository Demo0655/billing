/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * database.js - Data Layer & LocalStorage Management
 * 
 * STRICT RULE COMPLIANCE:
 * ZERO GST, ZERO TAX, ZERO CGST/SGST/IGST/HSN.
 * Simple calculations: Item Total = Qty * Rate; Subtotal = Sum; Grand Total = Subtotal - Discount.
 */

const DB = (() => {
  const KEYS = {
    PRODUCTS: 'ggm_products',
    CUSTOMERS: 'ggm_customers',
    BILLS: 'ggm_bills',
    SETTINGS: 'ggm_settings',
    COUNTER: 'ggm_bill_counter'
  };

  const DEFAULT_SETTINGS = {
    storeName: 'Gupta Grocery Mart',
    tagline: 'Premium Grocery Store',
    address: 'Shop No. 14, Main Market, Sector 4, Near Clock Tower',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'contact@guptagrocerymart.com',
    footerMessage: 'Thank You For Shopping With Us! Please Visit Again',
    invoicePrefix: 'GGM-',
    startingBillNumber: 1,
    currencySymbol: '₹',
    defaultPaymentMethod: 'Cash',
    receiptFormat: 'thermal', // 'thermal' (80mm) or 'standard' (A4)
    soundEnabled: true
  };

  const SAMPLE_PRODUCTS = [
    { id: 'PROD-101', name: 'Aashirvaad Superior MP Atta 5kg', category: 'Staples & Flour', barcode: '8901030383124', unit: 'PKT', sellingPrice: 280, stock: 45 },
    { id: 'PROD-102', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Spices & Salt', barcode: '8901030001011', unit: 'PKT', sellingPrice: 30, stock: 120 },
    { id: 'PROD-103', name: 'Fortune Refined Sunflower Oil 1L', category: 'Edible Oils', barcode: '8906007281014', unit: 'BTL', sellingPrice: 150, stock: 38 },
    { id: 'PROD-104', name: 'Tata Tea Premium 250g', category: 'Beverages', barcode: '8901052002341', unit: 'PKT', sellingPrice: 140, stock: 55 },
    { id: 'PROD-105', name: 'Parle-G Glucose Biscuits 250g', category: 'Snacks & Biscuits', barcode: '8901719101019', unit: 'PKT', sellingPrice: 20, stock: 140 },
    { id: 'PROD-106', name: 'Maggi 2-Minute Masala Noodles 70g', category: 'Instant Foods', barcode: '8901058852331', unit: 'PKT', sellingPrice: 15, stock: 160 },
    { id: 'PROD-107', name: 'Madhur Pure & Hygienic Sugar 1kg', category: 'Staples', barcode: '8901000000078', unit: 'KG', sellingPrice: 48, stock: 85 },
    { id: 'PROD-108', name: 'India Gate Feast Rozzana Basmati Rice 5kg', category: 'Rice & Grains', barcode: '8901452000015', unit: 'BAG', sellingPrice: 450, stock: 28 },
    { id: 'PROD-109', name: 'Tata Sampann Unpolished Toor Dal 1kg', category: 'Pulses & Dals', barcode: '8901000000092', unit: 'KG', sellingPrice: 150, stock: 42 },
    { id: 'PROD-110', name: 'Surf Excel Easy Wash Detergent Powder 1kg', category: 'Household & Cleaning', barcode: '8901030612345', unit: 'PKT', sellingPrice: 180, stock: 52 },
    { id: 'PROD-111', name: 'Amul Pure Cow Ghee 1L Tin', category: 'Dairy & Ghee', barcode: '8901262010101', unit: 'TIN', sellingPrice: 620, stock: 30 },
    { id: 'PROD-112', name: 'MDH Deggi Mirch Powder 100g', category: 'Spices', barcode: '8902500001012', unit: 'PKT', sellingPrice: 85, stock: 65 },
    { id: 'PROD-113', name: 'Dettol Original Bathing Soap 125g', category: 'Personal Care', barcode: '8901396000101', unit: 'PCS', sellingPrice: 45, stock: 75 },
    { id: 'PROD-114', name: 'Colgate Strong Teeth Toothpaste 200g', category: 'Personal Care', barcode: '8901314010101', unit: 'PCS', sellingPrice: 110, stock: 60 }
  ];

  const SAMPLE_CUSTOMERS = [
    { id: 'CUST-101', name: 'Aman Verma', phone: '9823456789', address: 'B-42, Shanti Nagar, Sector 4', totalBills: 3, totalPurchases: 2450, lastPurchase: '2026-10-08' },
    { id: 'CUST-102', name: 'Priya Sharma', phone: '9876512340', address: 'Plot 18, Green Valley Apts', totalBills: 2, totalPurchases: 1820, lastPurchase: '2026-10-08' },
    { id: 'CUST-103', name: 'Rajesh Gupta', phone: '9911223344', address: 'Shop 4, Main Bazaar', totalBills: 4, totalPurchases: 5400, lastPurchase: '2026-10-07' },
    { id: 'CUST-104', name: 'Sunita Devi', phone: '9810198101', address: 'H.No 105, Street 2', totalBills: 1, totalPurchases: 890, lastPurchase: '2026-10-06' }
  ];

  function seedDemoBills() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return [
      {
        billNo: 'GGM-000001',
        date: yesterdayStr,
        time: '11:15 AM',
        timestamp: yesterday.getTime() - 3600000 * 4,
        customerName: 'Sunita Devi',
        customerPhone: '9810198101',
        items: [
          { productId: 'PROD-101', name: 'Aashirvaad Superior MP Atta 5kg', qty: 1, unit: 'PKT', rate: 280, amount: 280 },
          { productId: 'PROD-102', name: 'Tata Salt Vacuum Evaporated 1kg', qty: 2, unit: 'PKT', rate: 30, amount: 60 },
          { productId: 'PROD-108', name: 'India Gate Feast Rozzana Basmati Rice 5kg', qty: 1, unit: 'BAG', rate: 450, amount: 450 },
          { productId: 'PROD-106', name: 'Maggi 2-Minute Masala Noodles 70g', qty: 4, unit: 'PKT', rate: 15, amount: 60 },
          { productId: 'PROD-105', name: 'Parle-G Glucose Biscuits 250g', qty: 2, unit: 'PKT', rate: 20, amount: 40 }
        ],
        subtotal: 890,
        discount: 0,
        grandTotal: 890,
        paymentMethod: 'Cash',
        amountReceived: 1000,
        change: 110,
        notes: ''
      },
      {
        billNo: 'GGM-000002',
        date: yesterdayStr,
        time: '04:45 PM',
        timestamp: yesterday.getTime() + 3600000 * 2,
        customerName: 'Rajesh Gupta',
        customerPhone: '9911223344',
        items: [
          { productId: 'PROD-111', name: 'Amul Pure Cow Ghee 1L Tin', qty: 2, unit: 'TIN', rate: 620, amount: 1240 },
          { productId: 'PROD-103', name: 'Fortune Refined Sunflower Oil 1L', qty: 3, unit: 'BTL', rate: 150, amount: 450 },
          { productId: 'PROD-107', name: 'Madhur Pure & Hygienic Sugar 1kg', qty: 5, unit: 'KG', rate: 48, amount: 240 },
          { productId: 'PROD-104', name: 'Tata Tea Premium 250g', qty: 2, unit: 'PKT', rate: 140, amount: 280 }
        ],
        subtotal: 2210,
        discount: 50,
        grandTotal: 2160,
        paymentMethod: 'UPI',
        amountReceived: 2160,
        change: 0,
        notes: 'GPay payment'
      },
      {
        billNo: 'GGM-000003',
        date: todayStr,
        time: '10:05 AM',
        timestamp: today.getTime() - 3600000 * 3,
        customerName: 'Priya Sharma',
        customerPhone: '9876512340',
        items: [
          { productId: 'PROD-110', name: 'Surf Excel Easy Wash Detergent Powder 1kg', qty: 2, unit: 'PKT', rate: 180, amount: 360 },
          { productId: 'PROD-113', name: 'Dettol Original Bathing Soap 125g', qty: 4, unit: 'PCS', rate: 45, amount: 180 },
          { productId: 'PROD-114', name: 'Colgate Strong Teeth Toothpaste 200g', qty: 2, unit: 'PCS', rate: 110, amount: 220 },
          { productId: 'PROD-102', name: 'Tata Salt Vacuum Evaporated 1kg', qty: 2, unit: 'PKT', rate: 30, amount: 60 }
        ],
        subtotal: 820,
        discount: 20,
        grandTotal: 800,
        paymentMethod: 'Card',
        amountReceived: 800,
        change: 0,
        notes: ''
      },
      {
        billNo: 'GGM-000004',
        date: todayStr,
        time: '12:30 PM',
        timestamp: today.getTime() - 3600000 * 1,
        customerName: 'Aman Verma',
        customerPhone: '9823456789',
        items: [
          { productId: 'PROD-101', name: 'Aashirvaad Superior MP Atta 5kg', qty: 2, unit: 'PKT', rate: 280, amount: 560 },
          { productId: 'PROD-102', name: 'Tata Salt Vacuum Evaporated 1kg', qty: 2, unit: 'PKT', rate: 30, amount: 60 }
        ],
        subtotal: 620,
        discount: 20,
        grandTotal: 600,
        paymentMethod: 'Cash',
        amountReceived: 1000,
        change: 400,
        notes: ''
      }
    ];
  }

  // Initialize DB
  function init() {
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS));
    }
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SAMPLE_CUSTOMERS));
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(KEYS.BILLS)) {
      const demoBills = seedDemoBills();
      localStorage.setItem(KEYS.BILLS, JSON.stringify(demoBills));
      localStorage.setItem(KEYS.COUNTER, (demoBills.length).toString());
    }
    if (!localStorage.getItem(KEYS.COUNTER)) {
      const bills = getBills();
      localStorage.setItem(KEYS.COUNTER, (bills.length).toString());
    }
  }

  // Products CRUD
  function getProducts() {
    try {
      const raw = localStorage.getItem(KEYS.PRODUCTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading products:', e);
      return [];
    }
  }

  function saveProduct(product) {
    const products = getProducts();
    if (product.id) {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...product };
      } else {
        products.push(product);
      }
    } else {
      product.id = 'PROD-' + Date.now();
      products.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  }

  function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return true;
  }

  function updateProductStock(id, qtyDeducted) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
      product.stock = Math.max(0, (Number(product.stock) || 0) - Number(qtyDeducted));
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }
  }

  // Customers CRUD
  function getCustomers() {
    try {
      const raw = localStorage.getItem(KEYS.CUSTOMERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading customers:', e);
      return [];
    }
  }

  function saveCustomer(customer) {
    const customers = getCustomers();
    if (customer.id) {
      const idx = customers.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...customer };
      } else {
        customers.push(customer);
      }
    } else {
      customer.id = 'CUST-' + Date.now();
      customer.totalBills = customer.totalBills || 0;
      customer.totalPurchases = customer.totalPurchases || 0;
      customer.lastPurchase = customer.lastPurchase || new Date().toISOString().split('T')[0];
      customers.push(customer);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    return customer;
  }

  function deleteCustomer(id) {
    const customers = getCustomers().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    return true;
  }

  function recordCustomerPurchase(name, phone, billTotal) {
    if (!name && !phone) return;
    const customers = getCustomers();
    let customer = null;
    if (phone) {
      customer = customers.find(c => c.phone && c.phone.trim() === phone.trim());
    }
    if (!customer && name) {
      customer = customers.find(c => c.name && c.name.trim().toLowerCase() === name.trim().toLowerCase());
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (customer) {
      customer.totalBills = (customer.totalBills || 0) + 1;
      customer.totalPurchases = (customer.totalPurchases || 0) + Number(billTotal);
      customer.lastPurchase = todayStr;
      if (name && !customer.name) customer.name = name;
      if (phone && !customer.phone) customer.phone = phone;
    } else {
      customer = {
        id: 'CUST-' + Date.now(),
        name: name || 'Walk-in Customer',
        phone: phone || '',
        address: '',
        totalBills: 1,
        totalPurchases: Number(billTotal),
        lastPurchase: todayStr
      };
      customers.push(customer);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  // Bills Management
  function getBills() {
    try {
      const raw = localStorage.getItem(KEYS.BILLS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading bills:', e);
      return [];
    }
  }

  function getBillByNo(billNo) {
    const bills = getBills();
    return bills.find(b => b.billNo === billNo);
  }

  function getNextBillNo() {
    const settings = getSettings();
    const prefix = settings.invoicePrefix || 'GGM-';
    let currentCounter = parseInt(localStorage.getItem(KEYS.COUNTER) || '0', 10);
    const nextNumber = currentCounter + 1;
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  function saveBill(bill) {
    const bills = getBills();
    const settings = getSettings();
    const prefix = settings.invoicePrefix || 'GGM-';

    if (!bill.billNo) {
      let currentCounter = parseInt(localStorage.getItem(KEYS.COUNTER) || '0', 10);
      currentCounter += 1;
      bill.billNo = `${prefix}${String(currentCounter).padStart(6, '0')}`;
      localStorage.setItem(KEYS.COUNTER, currentCounter.toString());
    }

    bill.timestamp = bill.timestamp || Date.now();
    bills.unshift(bill);
    localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));

    // Deduct stock for each item
    if (Array.isArray(bill.items)) {
      bill.items.forEach(item => {
        if (item.productId) {
          updateProductStock(item.productId, item.qty);
        }
      });
    }

    // Record customer transaction
    if (bill.customerName || bill.customerPhone) {
      recordCustomerPurchase(bill.customerName, bill.customerPhone, bill.grandTotal);
    }

    return bill;
  }

  function deleteBill(billNo) {
    const bills = getBills().filter(b => b.billNo !== billNo);
    localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
    return true;
  }

  // Settings
  function getSettings() {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.error('Error reading settings:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(newSettings) {
    // Sanitize any accidental tax or GST entries
    delete newSettings.gstNumber;
    delete newSettings.cgst;
    delete newSettings.sgst;
    delete newSettings.igst;
    delete newSettings.hsn;
    delete newSettings.gst;
    
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // Backup & Restore
  function exportBackupData() {
    const backup = {
      app: 'Gupta Grocery Mart POS',
      version: '2.4.0',
      exportDate: new Date().toISOString(),
      counter: localStorage.getItem(KEYS.COUNTER) || '0',
      settings: getSettings(),
      products: getProducts(),
      customers: getCustomers(),
      bills: getBills()
    };
    return JSON.stringify(backup, null, 2);
  }

  function importBackupData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.bills)) {
        throw new Error('Invalid backup file format.');
      }
      if (data.products) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.bills) localStorage.setItem(KEYS.BILLS, JSON.stringify(data.bills));
      if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.counter) localStorage.setItem(KEYS.COUNTER, data.counter.toString());
      return { success: true, countProducts: data.products.length, countBills: data.bills.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function resetToDemo() {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS));
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(SAMPLE_CUSTOMERS));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    const demoBills = seedDemoBills();
    localStorage.setItem(KEYS.BILLS, JSON.stringify(demoBills));
    localStorage.setItem(KEYS.COUNTER, (demoBills.length).toString());
    return true;
  }

  // Initialize immediately
  init();

  return {
    getProducts,
    saveProduct,
    deleteProduct,
    updateProductStock,
    getCustomers,
    saveCustomer,
    deleteCustomer,
    getBills,
    getBillByNo,
    getNextBillNo,
    saveBill,
    deleteBill,
    getSettings,
    saveSettings,
    exportBackupData,
    importBackupData,
    resetToDemo
  };
})();

window.DB = DB;
