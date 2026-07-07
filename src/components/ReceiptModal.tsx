import React, { useRef } from 'react';
import { SaleLog } from '../db';
import { useAppContext } from '../AppContext';
import { X, Printer, Download, Share2 } from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdf';
import { format } from 'date-fns';

interface ReceiptModalProps {
  sale: SaleLog;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  const { settings } = useAppContext();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Use iframe to print specific area, or react-to-print approach.
    // For simplicity, we can do a quick window.print using CSS media print 
    // but the best way is to extract innerHTML into a popup window and print that.
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = receiptRef.current?.innerHTML || '';
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; padding: 10px; width: 300px; margin: 0 auto; color: #000; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .text-xl { font-size: 1.25rem; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .border-b { border-bottom: 1px dashed #ccc; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .pt-2 { padding-top: 0.5rem; }
              .pb-2 { padding-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-4 { margin-top: 1rem; }
              .w-full { width: 100%; }
              .logo { max-width: 80px; margin: 0 auto 10px; display: block; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleDownload = () => {
    generateReceiptPDF(sale, settings);
  };

  const handleShare = async () => {
    if (navigator.share) {
      const text = `Receipt #${sale.id} from ${settings.businessName}\nTotal: $${sale.totalAmount.toFixed(2)}`;
      try {
        await navigator.share({
          title: `Receipt #${sale.id}`,
          text: text
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Sharing is not supported on this device.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800">Sale Processed Successfully</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100">
          <div ref={receiptRef} className="bg-white p-6 shadow-sm border border-slate-200 w-full max-w-[300px] text-slate-800 text-sm font-mono flex flex-col">
            {settings.logo && <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2 logo" />}
            <h2 className="text-xl font-bold text-center">{settings.businessName}</h2>
            <p className="text-xs text-center mb-1">{settings.motto}</p>
            <div className="text-xs text-center border-b pb-2 mb-2 border-slate-200">
              <p>Tel: {settings.phone}</p>
              <p>Email: {settings.email}</p>
              {settings.vatNumber && <p>VAT: {settings.vatNumber}</p>}
            </div>
            
            <div className="text-xs mb-2">
              <p>Receipt #: {sale.id}</p>
              <p>Date: {format(new Date(sale.timestamp), 'dd/MM/yy HH:mm')}</p>
              <p>Cashier: {sale.salespersonName}</p>
              <p>Customer: {sale.customerName || 'Walk-in'}</p>
            </div>
            
            <div className="border-b border-slate-200 pb-2 mb-2">
              <div className="flex justify-between font-bold text-xs pb-1 border-b border-slate-200 mb-1">
                <span>Item</span>
                <span>Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <div className="flex-1 pr-2">
                    <div>{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.quantity} x ${item.unitPrice.toFixed(2)}</div>
                  </div>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="text-xs space-y-1 border-b border-slate-200 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${sale.subTotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-${sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-1">
                <span>Total</span>
                <span>${sale.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center text-xs mt-4">
              <p className="font-bold">Thank you for shopping from us!</p>
              <p className="text-[10px] text-slate-400 mt-2">Receipt processed by Comfort POS System</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-3 gap-2 shrink-0">
          <button onClick={handlePrint} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs transition-colors">
            <Printer size={18} className="mb-1" />
            Print
          </button>
          <button onClick={handleDownload} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50 border border-slate-200 text-blue-600 font-bold text-xs transition-colors">
            <Download size={18} className="mb-1" />
            PDF
          </button>
          <button onClick={handleShare} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50 border border-slate-200 text-emerald-600 font-bold text-xs transition-colors">
            <Share2 size={18} className="mb-1" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
