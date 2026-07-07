import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export function generateReceiptPDF(sale: any, settings: any) {
  const doc = new jsPDF({
    format: [80, 200], // typical receipt size
    unit: 'mm'
  });
  let y = 10;
  
  if (settings.logo) {
    try {
      // Assuming logo is a base64 image
      // Infer image type from data URL or default to PNG
      const imgType = settings.logo.includes('image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(settings.logo, imgType, 30, y, 20, 20); // x=30 so it centers (80 width / 2 - 10)
      y += 25;
    } catch (e) {
      console.error('Failed to add logo to PDF:', e);
    }
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.businessName || 'Store', 40, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (settings.motto) {
    doc.text(settings.motto, 40, y, { align: 'center' });
    y += 5;
  }
  
  if (settings.phone) {
    doc.text(`Tel: ${settings.phone}`, 40, y, { align: 'center' });
    y += 4;
  }
  if (settings.email) {
    doc.text(`Email: ${settings.email}`, 40, y, { align: 'center' });
    y += 4;
  }
  if (settings.vatNumber) {
    doc.text(`VAT: ${settings.vatNumber}`, 40, y, { align: 'center' });
    y += 4;
  }
  
  y += 3;
  
  doc.setLineWidth(0.5);
  
  doc.line(5, y, 75, y);
  
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.status === 'quotation' ? 'QUOTATION' : 'RECEIPT', 40, y, { align: 'center' });
  y += 5;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${sale.id || ''}`, 5, y);
  y += 4;
  doc.text(`Date: ${format(new Date(sale.timestamp || Date.now()), 'dd/MM/yyyy HH:mm')}`, 5, y);
  y += 4;
  doc.text(`Cashier: ${sale.salespersonName || ''}`, 5, y);
  y += 4;
  doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 5, y);
  y += 3;
  
  doc.line(5, y, 75, y);
  y += 2;
  
  const tableData = sale.items.map((item: any) => [
    item.name || item.productName,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)}`,
    `${item.totalPrice.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { fontStyle: 'bold', halign: 'left', cellPadding: 1, fontSize: 8 },
    bodyStyles: { cellPadding: 1, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' }
    },
    margin: { left: 5, right: 5 }
  });
  
  y = (doc as any).lastAutoTable.finalY + 5;
  
  doc.setFontSize(8);
  if (sale.discount > 0) {
    doc.text('Subtotal:', 45, y);
    doc.text(`${(sale.totalAmount + sale.discount).toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
    doc.text('Discount:', 45, y);
    doc.text(`-${sale.discount.toFixed(2)}`, 75, y, { align: 'right' });
    y += 4;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 45, y);
  doc.text(`${sale.totalAmount.toFixed(2)}`, 75, y, { align: 'right' });
  y += 6;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paid by: ${sale.paymentMethod || 'Cash'}`, 5, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for shopping from us!', 40, y, { align: 'center' });
  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Receipt processed by Comfort POS System', 40, y, { align: 'center' });
  
  doc.save(`Receipt_${sale.id || Date.now()}.pdf`);
}