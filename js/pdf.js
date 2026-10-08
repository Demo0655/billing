/**
 * GUPTA GROCERY MART - POS & BILLING SYSTEM
 * pdf.js - Client-Side Invoice PDF Generation using jsPDF
 * 
 * STRICT COMPLIANCE:
 * - NO GST, CGST, SGST, IGST, HSN or Tax anywhere in the PDF
 * - Item Price × Qty = Item Total
 * - Subtotal = Sum
 * - Grand Total = Subtotal - Discount
 */

const InvoicePDF = (() => {
  function generate(billData) {
    if (!billData) {
      if (window.App && window.App.showToast) {
        window.App.showToast('No bill data available for PDF', 'danger');
      }
      return;
    }

    const settings = DB.getSettings();
    const { jsPDF } = window.jspdf || {};

    if (!jsPDF) {
      console.warn('jsPDF library not loaded. Triggering standard print dialog as fallback.');
      window.print();
      return;
    }

    try {
      // Create a clean invoice doc (A4 portrait)
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let y = margin;

      // Color Palette (RGB)
      const royalNavy = [13, 27, 42];     // #0d1b2a
      const antiqueGold = [197, 155, 39];  // #c59b27
      const darkCharcoal = [30, 34, 41];   // #1e2229
      const lightBg = [250, 248, 245];     // #faf8f5
      const borderGray = [220, 224, 230];

      // Top Decorative Gold & Navy Stripe
      doc.setFillColor(...royalNavy);
      doc.rect(margin, y, pageWidth - (margin * 2), 26, 'F');

      doc.setFillColor(...antiqueGold);
      doc.rect(margin, y + 26, pageWidth - (margin * 2), 2, 'F');

      // Store Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text((settings.storeName || 'GUPTA GROCERY MART').toUpperCase(), pageWidth / 2, y + 11, { align: 'center' });

      // Store Subtitle
      doc.setTextColor(247, 223, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(settings.tagline || 'Premium Grocery Store', pageWidth / 2, y + 17, { align: 'center' });

      // Contact & Address under header banner
      y += 33;
      doc.setTextColor(...darkCharcoal);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.address || 'Main Market, Sector 4', pageWidth / 2, y, { align: 'center' });
      y += 4.5;
      doc.text(`Phone: ${settings.phone || ''}  |  WhatsApp: ${settings.whatsapp || ''}`, pageWidth / 2, y, { align: 'center' });

      // Divider
      y += 5;
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);

      // Bill Info Bar (2 Columns: Left Bill info, Right Customer info)
      y += 6;
      const colWidth = (pageWidth - (margin * 2)) / 2;

      // Left Column: Bill details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...royalNavy);
      doc.text(`INVOICE: ${billData.billNo || 'GGM-000000'}`, margin, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      y += 5;
      doc.text(`Date: ${billData.date || new Date().toISOString().split('T')[0]}`, margin, y);
      y += 4.5;
      doc.text(`Time: ${billData.time || ''}`, margin, y);

      // Right Column: Customer details
      let custY = y - 9.5;
      const rightX = margin + colWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...royalNavy);
      doc.text('CUSTOMER DETAILS', rightX, custY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      custY += 5;
      doc.text(`Name: ${billData.customerName || 'Walk-in Customer'}`, rightX, custY);
      custY += 4.5;
      doc.text(`Mobile: ${billData.customerPhone || 'N/A'}`, rightX, custY);

      y = Math.max(y, custY) + 6;

      // Items Table using autoTable plugin if present, or manual table fallback
      const tableRows = (billData.items || []).map((item, index) => [
        String(index + 1),
        item.name || 'Grocery Item',
        `${item.qty} ${item.unit || 'PCS'}`,
        `Rs. ${Number(item.rate || 0).toFixed(2)}`,
        `Rs. ${Number(item.amount || 0).toFixed(2)}`
      ]);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: y,
          margin: { left: margin, right: margin },
          head: [['#', 'ITEM DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: royalNavy,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            halign: 'left'
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 'auto', halign: 'left' },
            2: { cellWidth: 26, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 32, halign: 'right' }
          },
          bodyStyles: {
            fontSize: 8.5,
            textColor: darkCharcoal,
            cellPadding: 3
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          }
        });

        y = doc.lastAutoTable.finalY + 6;
      } else {
        // Fallback manual table rendering
        doc.setFillColor(...royalNavy);
        doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('#', margin + 3, y + 5);
        doc.text('ITEM DESCRIPTION', margin + 14, y + 5);
        doc.text('QTY', margin + 105, y + 5);
        doc.text('RATE', margin + 130, y + 5);
        doc.text('AMOUNT', pageWidth - margin - 5, y + 5, { align: 'right' });
        y += 8;

        (billData.items || []).forEach((item, idx) => {
          doc.setTextColor(...darkCharcoal);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(String(idx + 1), margin + 3, y);
          doc.text(item.name.substring(0, 48), margin + 14, y);
          doc.text(`${item.qty} ${item.unit || ''}`, margin + 105, y);
          doc.text(`Rs. ${Number(item.rate).toFixed(2)}`, margin + 130, y);
          doc.text(`Rs. ${Number(item.amount).toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });
          y += 5.5;
        });
        y += 4;
      }

      // Calculation & Summary Section (Clean right-aligned box)
      const summaryBoxWidth = 78;
      const summaryX = pageWidth - margin - summaryBoxWidth;
      
      // Border box for Summary
      doc.setFillColor(252, 252, 253);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(summaryX, y, summaryBoxWidth, 42, 2, 2, 'FD');

      let sumY = y + 7;
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', summaryX + 5, sumY);
      doc.text(`Rs. ${Number(billData.subtotal || 0).toFixed(2)}`, pageWidth - margin - 5, sumY, { align: 'right' });

      sumY += 6;
      doc.text('Discount:', summaryX + 5, sumY);
      doc.text(`- Rs. ${Number(billData.discount || 0).toFixed(2)}`, pageWidth - margin - 5, sumY, { align: 'right' });

      // Grand Total Highlight Bar
      sumY += 4;
      doc.setFillColor(...royalNavy);
      doc.rect(summaryX, sumY, summaryBoxWidth, 9, 'F');
      
      doc.setTextColor(247, 223, 139); // Gold text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('GRAND TOTAL:', summaryX + 5, sumY + 6.2);
      doc.text(`Rs. ${Number(billData.grandTotal || 0).toFixed(2)}`, pageWidth - margin - 5, sumY + 6.2, { align: 'right' });

      sumY += 13;
      doc.setTextColor(70, 70, 70);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Payment Mode: ${billData.paymentMethod || 'Cash'}`, summaryX + 5, sumY);

      if (billData.amountReceived && billData.amountReceived > 0) {
        sumY += 4.5;
        doc.text(`Amount Received: Rs. ${Number(billData.amountReceived).toFixed(2)}`, summaryX + 5, sumY);
        if (billData.change && billData.change > 0) {
          sumY += 4;
          doc.text(`Change Given: Rs. ${Number(billData.change).toFixed(2)}`, summaryX + 5, sumY);
        }
      }

      // Left side notes / thank you message
      let leftY = y + 8;
      doc.setTextColor(...royalNavy);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PAYMENT DETAILS', margin, leftY);
      leftY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(`Paid via: ${billData.paymentMethod || 'Cash'}`, margin, leftY);
      leftY += 4.5;
      doc.text(`Status: Paid in Full`, margin, leftY);
      if (billData.notes) {
        leftY += 4.5;
        doc.text(`Remarks: ${billData.notes}`, margin, leftY);
      }

      // Bottom Footer Banner
      const footerY = pageHeight - 20;
      doc.setDrawColor(...antiqueGold);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...royalNavy);
      doc.text(settings.footerMessage || 'Thank You For Shopping With Us! Please Visit Again', pageWidth / 2, footerY + 6, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('This is a computer-generated retail invoice. No signature required.', pageWidth / 2, footerY + 11, { align: 'center' });

      // Save PDF file
      const safeCustomer = (billData.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Bill_${billData.billNo || 'GGM'}_${safeCustomer}.pdf`;
      doc.save(filename);

      if (window.App && window.App.showToast) {
        window.App.showToast(`Invoice PDF generated: ${filename}`, 'success');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (window.App && window.App.showToast) {
        window.App.showToast('Could not generate PDF. Please try standard print.', 'danger');
      }
    }
  }

  return {
    generate
  };
})();

window.InvoicePDF = InvoicePDF;
