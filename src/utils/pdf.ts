import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export function generateReceiptPDF(sale: any, settings: any) {
  const doc = new jsPDF({
    format: [80, 200], // typical receipt size
    unit: 'mm'
  });

  let y = 10;
  
  doc.setFontSize(16);
  doc.text(settings.businessName || 'Store', 40, y, { align: 'center' });
  y += 6;
  
  doc.setFontSize(10);
  if (settings.motto) {
    doc.text(settings.motto, 40, y, { align: 'center' });
    y += 5;
  }
  if (settings.phone) {
    doc.text(settings.phone, 40, y, { align: 'center' });
    y += 5;
  }
  
  y += 5;
  doc.setFontSize(12);
  doc.text(sale.status === 'quotation' ? 'QUOTATION' : 'RECEIPT', 40, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(9);
  doc.text(`Date: ${format(new Date(sale.timestamp || Date.now()), 'dd/MM/yyyy HH:mm')}`, 5, y);
  y += 5;
  doc.text(`Cashier: ${sale.salespersonName || ''}`, 5, y);
  y += 5;
  if (sale.customerName) {
    doc.text(`Customer: ${sale.customerName}`, 5, y);
    y += 5;
  }
  if (sale.id) {
    doc.text(`Receipt #: ${sale.id}`, 5, y);
    y += 5;
  }
  
  y += 2;
  
  const tableData = sale.items.map((item: any) => [
    item.name || item.productName,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.totalPrice.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { fontStyle: 'bold', halign: 'left', cellPadding: 1, fontSize: 8 },
    bodyStyles: { cellPadding: 1, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' }
    },
    margin: { left: 5, right: 5 }
  });

  y = (doc as any).lastAutoTable.finalY + 5;
  
  doc.setFontSize(9);
  if (sale.discount > 0) {
    doc.text('Subtotal:', 45, y);
    doc.text(`$${(sale.totalAmount + sale.discount).toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
    doc.text('Discount:', 45, y);
    doc.text(`$${sale.discount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
  }
  
  doc.setFontSize(11);
  doc.text('Total:', 45, y);
  doc.text(`$${sale.totalAmount.toFixed(2)}`, 75, y, { align: 'right' });
  y += 8;
  
  doc.setFontSize(9);
  doc.text(`Paid by: ${sale.paymentMethod || 'Cash'}`, 5, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text('Thank you for shopping from us!', 40, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.text('Receipt processed by Comfort POS System', 40, y, { align: 'center' });

  doc.save(`Receipt_${sale.id || Date.now()}.pdf`);
}
