# GUPTA GROCERY MART — POS & BILLING SYSTEM

A complete, production-ready, professional commercial **Grocery Retail POS & Billing Application** designed exclusively with **HTML5, CSS3, and Vanilla JavaScript**.

---

## 👑 Royal & Elegant Aesthetic

- **Design Identity:** Royal Deep Navy (`#070d18` / `#111e33`), Dark Charcoal, Rich Burgundy accents (`#6b1426`), and Antique Gold (`#d4af37` / `#f7df8b`).
- **Typography:** Google Fonts *Plus Jakarta Sans*, *Cinzel* (Royal serif headers), and *JetBrains Mono* (monospaced pricing and barcode displays).
- **Zero Third-party Frameworks:** No React, Angular, Vue, Bootstrap, or Tailwind.
- **Pure Offline Desktop Experience:** Can run completely standalone without any server or backend infrastructure.

---

## 🚫 STRICT ZERO GST COMPLIANCE

**Gupta Grocery Mart operates under 100% Non-GST retail shop guidelines.**

- **ZERO** GST number fields
- **ZERO** CGST / SGST / IGST calculation
- **ZERO** Tax percentage, HSN, or SAC fields
- **ZERO** GST settings or configurations
- **Formula:**
  $$\text{Item Amount} = \text{Item Price} \times \text{Quantity}$$
  $$\text{Subtotal} = \sum \text{Item Amount}$$
  $$\text{Grand Total} = \text{Subtotal} - \text{Discount}$$
  $$\text{Change to Return} = \text{Amount Received} - \text{Grand Total}$$

---

## 🚀 Key Modules & Capabilities

1. **Dashboard:**
   - Real-time stat cards: Today's Sales, Today's Bills, Total Products, Total Customers, and Average Bill Value.
   - Interactive sales chart built with pure HTML5 Canvas (Today, This Week, This Month).
   - Recent bills summary table with instant reprint, PDF download, and WhatsApp share buttons.

2. **POS Billing Terminal (`New Bill`):**
   - Auto-incrementing bill numbering starting from `GGM-000001` (persisted in localStorage).
   - USB Barcode Scanner support with rapid automatic lookup and Enter key detection.
   - Live product search with keyboard up/down arrows and Enter to add.
   - Fast-pick staples bar for high-frequency items (Atta, Salt, Oil, Sugar, Tea, Maggi, Rice, Dal).
   - Dynamic table rows with direct inline quantity and rate editing, instant total updates.
   - Amount received and real-time Change / Balance Due calculation.
   - Audio synthesized POS beep chimes via Web Audio API.

3. **Products Inventory Management:**
   - Catalog management with categories, barcode assignment, units, prices, and stock counts.
   - Status indicators: In Stock, Low Stock (≤10), Out of Stock.
   - Automatic barcode generator.
   - Zero GST fields in add/edit modals.

4. **Customer Relationship Directory:**
   - Tracks customer names, phone numbers, addresses, total bills, and lifetime purchases.
   - Purchase history drawer showing all past invoices for any customer.

5. **Sales History:**
   - Filter by: Today, Yesterday, This Week, This Month, or Custom Date Range.
   - Search by Bill No., Customer Name, or Phone.
   - Invoice detail inspection modal, re-printing, PDF export, and WhatsApp sharing.

6. **Reports & Analytics:**
   - Gross revenue, average bill value, and weekly/monthly performance.
   - Top-selling products leaderboard.
   - Payment method breakdown (Cash vs UPI vs Card vs Other) with pure HTML5 Canvas Donut Chart.

7. **Settings & Backup:**
   - Store profile customization (Address, Phone, WhatsApp, Invoice Prefix, Footer Greeting).
   - Dual receipt modes: 80mm POS Thermal Receipt and Standard A4 Invoice.
   - 1-click JSON backup export and restore.
   - Demo data reset option.

---

## ⌨️ POS Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **F1** | Switch to New Bill Terminal |
| **F2** | Focus Product Search / Barcode Input |
| **F3** | Save Current Bill |
| **F4** | Save Bill &amp; Print Immediately |
| **F5** | Export Invoice to PDF (Browser reload prevented) |
| **F6** | Share Invoice via WhatsApp |
| **ESC** | Close Active Modals / Prompt Clear Bill |
| **Enter** | Barcode Scanner auto-add item |

---

## 📁 Directory Structure

```text
gupta-grocery-mart/
│
├── index.html                  # Master application entry point
│
├── css/
│   ├── style.css               # Royal design system & UI components
│   ├── responsive.css          # Tablet and mobile viewport rules
│   └── print.css               # Dedicated print receipt stylesheet
│
├── js/
│   ├── app.js                  # Application coordinator & keyboard events
│   ├── database.js             # LocalStorage engine, seeding & Zero-GST logic
│   ├── billing.js              # POS terminal engine & barcode parser
│   ├── products.js             # Inventory & catalog management
│   ├── customers.js            # Customer tracking & purchase history
│   ├── sales.js                # Sales history, filtering & invoice view
│   ├── reports.js              # Analytics & pure Canvas charts
│   ├── settings.js             # Store config, JSON backup & restore
│   ├── pdf.js                  # Client-side jsPDF invoice generator
│   ├── whatsapp.js             # Formatted WhatsApp invoice share
│   └── vendor/
│       ├── jspdf.umd.min.js
│       └── jspdf.plugin.autotable.min.js
│
├── assets/
│   ├── logo.svg                # Royal gold crest & store emblem
│   └── favicon.svg             # Favicon asset
│
└── README.md
```

---

## 💻 How to Run Locally

Double-click `index.html` or open it with any web browser (Chrome, Edge, Firefox, Brave, Safari). No web server, Node.js, or build step is required!
