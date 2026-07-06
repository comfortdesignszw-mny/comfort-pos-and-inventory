import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SaleLog } from '../db';
import { format } from 'date-fns';
import { Search, FileText, Printer, Filter, Download } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function SalesHistory() {
  const { settings } = useAppContext();
  const sales = useLiveQuery(() => db.sales.orderBy('timestamp').reverse().toArray()) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleLog | null>(null);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id?.toString().includes(searchTerm) || 
                          sale.salespersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
    const matchesDate = dateFilter ? saleDate === dateFilter : true;
    
    const matchesPayment = paymentFilter ? sale.paymentMethod === paymentFilter : true;

    return matchesSearch && matchesDate && matchesPayment;
  });

  const exportCSV = () => {
    import('../utils/export').then(m => {
      const data = sales.map(s => ({
        ID: s.id,
        Date: format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm'),
        Customer: s.customerName || 'Walk-in',
        Salesperson: s.salespersonName,
        Method: s.paymentMethod,
        Total: s.totalAmount,
        Items: s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
      }));
      m.exportToCSV(data, 'Full_Sales_History.csv');
    });
  };

  const exportPDF = () => {
    import('jspdf').then(jspdf => {
      import('jspdf-autotable').then(autoTable => {
        const jsPDF = jspdf.default;
        const doc = new jsPDF();
        doc.text('Sales History Report', 14, 15);
        const tableData = filteredSales.map(s => [
          s.id?.toString() || '',
          format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm'),
          s.customerName || 'Walk-in',
          s.salespersonName,
          s.paymentMethod,
          `$${s.totalAmount.toFixed(2)}`
        ]);
        autoTable.default(doc, {
          startY: 20,
          head: [['Receipt #', 'Date', 'Customer', 'Staff', 'Method', 'Total']],
          body: tableData,
        });
        doc.save('Sales_History.pdf');
      });
    });
  };

  const handlePrint = (sale: SaleLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptContent = `
      <html>
        <head>
          <title>Receipt #${sale.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .flex-between { display: flex; justify-content: space-between; }
            .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .text-sm { font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="text-center mb-4">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 60px; margin-bottom: 10px;" />` : ''}
            <h2 class="mb-2" style="margin-top: 0;">${settings.businessName}</h2>
            <div class="text-sm">${settings.motto}</div>
            <div class="text-sm">Phone: ${settings.phone}</div>
            <div class="text-sm">VAT: ${settings.vatNumber}</div>
          </div>
          
          <div class="mb-4 text-sm border-b">
            <div>Receipt #: ${sale.id}</div>
            <div>Date: ${format(new Date(sale.timestamp), 'dd MMM yyyy, HH:mm')}</div>
            <div>Cashier: ${sale.salespersonName}</div>
            ${sale.customerName ? `<div>Customer: ${sale.customerName}</div>` : ''}
          </div>

          <div class="mb-4">
            ${sale.items.map(item => `
              <div class="flex-between text-sm mb-2">
                <div>
                  <div class="font-bold">${item.name}</div>
                  <div>${item.quantity} x $${item.unitPrice.toFixed(2)}</div>
                </div>
                <div>$${item.totalPrice.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>

          <div class="border-t text-sm">
            <div class="flex-between mb-2">
              <span>Subtotal:</span>
              <span>$${sale.subTotal.toFixed(2)}</span>
            </div>
            ${sale.discount > 0 ? `
              <div class="flex-between mb-2">
                <span>Discount:</span>
                <span>-$${sale.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="flex-between font-bold mb-2" style="font-size: 16px;">
              <span>Total:</span>
              <span>$${sale.totalAmount.toFixed(2)}</span>
            </div>
            <div class="flex-between mb-2">
              <span>Payment Method:</span>
              <span style="text-transform: capitalize;">${sale.paymentMethod}</span>
            </div>
          </div>

          <div class="text-center border-t mt-4 text-sm" style="padding-top: 20px;">
            <div>Thank you for your business!</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Sales History</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search sales..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2">
             <Filter className="w-4 h-4 text-slate-400" />
             <input 
                type="date"
                className="py-2 text-sm bg-transparent focus:outline-none text-slate-700"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
             />
          </div>
          <select 
            className="py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
             <option value="">All Methods</option>
             <option value="Cash">Cash</option>
             <option value="Card (USD)">Card (USD)</option>
             <option value="Card (ZiG)">Card (ZiG)</option>
             <option value="Ecocash">Ecocash</option>
          </select>
          <div className="flex space-x-2 border-l border-slate-200 pl-3">
            <button 
              onClick={exportCSV}
              className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
              title="Export CSV"
            >
              <Download size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
              title="Export PDF"
            >
              <FileText size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt #</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer / Staff</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100 text-sm text-slate-600">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedSale(sale)}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                  {format(new Date(sale.timestamp), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-500">
                  #{sale.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="font-bold text-slate-800">{sale.customerName || 'Walk-in Customer'}</div>
                   <div className="text-xs text-slate-400">by {sale.salespersonName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 inline-flex text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-black text-emerald-600">
                  ${sale.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      import('../utils/pdf').then(m => m.generateReceiptPDF(sale, settings));
                    }} 
                    className="text-slate-500 hover:text-blue-600 p-1 mr-2 rounded-md hover:bg-blue-50 transition-colors"
                    title="Download PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrint(sale); }} 
                    className="text-slate-500 hover:text-emerald-600 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                    title="Print Receipt"
                  >
                    <Printer size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No sales found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                 <h3 className="text-lg font-bold text-slate-800 flex items-center">
                   <FileText className="w-5 h-5 mr-2 text-emerald-600" />
                   Receipt #{selectedSale.id}
                 </h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                   {format(new Date(selectedSale.timestamp), 'dd MMM yyyy, HH:mm')}
                 </p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cashier</p>
                   <p className="font-bold text-slate-700">{selectedSale.salespersonName}</p>
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Customer</p>
                   <p className="font-bold text-slate-700">{selectedSale.customerName || 'Walk-in Customer'}</p>
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Method</p>
                   <p className="font-bold text-slate-700 capitalize">{selectedSale.paymentMethod}</p>
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Type</p>
                   <p className="font-bold text-slate-700 capitalize">{selectedSale.status}</p>
                 </div>
               </div>

               <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Items</h4>
               <div className="space-y-3">
                 {selectedSale.items.map((item, index) => (
                   <div key={index} className="flex justify-between items-center text-sm">
                     <div className="flex-1 pr-4">
                       <p className="font-bold text-slate-700">{item.name}</p>
                       <p className="text-slate-500 font-medium">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                     </div>
                     <span className="font-black text-slate-800">${item.totalPrice.toFixed(2)}</span>
                   </div>
                 ))}
               </div>

               <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>Subtotal</span>
                    <span>${selectedSale.subTotal.toFixed(2)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm font-medium text-red-500">
                      <span>Discount</span>
                      <span>-${selectedSale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-emerald-600 pt-2">
                    <span className="uppercase tracking-tight text-slate-800">Total</span>
                    <span>${selectedSale.totalAmount.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setSelectedSale(null)} 
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => handlePrint(selectedSale)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm flex items-center"
              >
                <Printer size={16} className="mr-2" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
