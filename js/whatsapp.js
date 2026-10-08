/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * whatsapp.js - WhatsApp Sharing Formatter & Dispatcher
 * 
 * STRICT COMPLIANCE: ZERO GST MENTION.
 */

const WhatsAppShare = (() => {
  function formatBillMessage(billData) {
    const settings = DB.getSettings();
    const storeName = settings.storeName || 'Gupta Grocery Mart';
    const currency = settings.currencySymbol || '₹';

    let itemsText = '';
    if (Array.isArray(billData.items) && billData.items.length > 0) {
      itemsText = billData.items.map(item => {
        return `${item.name} × ${item.qty} = ${currency}${Number(item.amount).toFixed(2)}`;
      }).join('\n');
    } else {
      itemsText = 'No items listed';
    }

    const message = 
`*${storeName.toUpperCase()}*

*Bill No:* ${billData.billNo || 'N/A'}
*Date:* ${billData.date || new Date().toISOString().split('T')[0]}
${billData.customerName ? `*Customer:* ${billData.customerName}\n` : ''}
*Items:*
${itemsText}

----------------------------
*Subtotal:* ${currency}${Number(billData.subtotal || 0).toFixed(2)}
*Discount:* ${currency}${Number(billData.discount || 0).toFixed(2)}
*Grand Total:* ${currency}${Number(billData.grandTotal || 0).toFixed(2)}

*Payment:* ${billData.paymentMethod || 'Cash'}

Thank you for shopping with ${storeName}.
Please visit again!`;

    return message;
  }

  function share(billData) {
    if (!billData) {
      if (window.App && window.App.showToast) {
        window.App.showToast('No bill selected for WhatsApp', 'warning');
      }
      return;
    }

    const message = formatBillMessage(billData);
    const encodedText = encodeURIComponent(message);

    // Clean phone number: remove spaces, dashes, parentheses
    let rawPhone = billData.customerPhone ? String(billData.customerPhone).replace(/[^0-9]/g, '') : '';
    
    // If Indian 10-digit number without country code, add 91
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }

    let url = '';
    if (rawPhone) {
      url = `https://wa.me/${rawPhone}?text=${encodedText}`;
    } else {
      url = `https://wa.me/?text=${encodedText}`;
    }

    // Open WhatsApp in new window
    window.open(url, '_blank');

    if (window.App && window.App.showToast) {
      window.App.showToast('WhatsApp sharing window opened', 'success');
    }
  }

  return {
    formatBillMessage,
    share
  };
})();

window.WhatsAppShare = WhatsAppShare;
