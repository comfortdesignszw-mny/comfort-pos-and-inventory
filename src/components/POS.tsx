import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product, SaleItem } from '../db';
import { useAppContext } from '../AppContext';
import { withAuditLog } from '../utils/audit';
import { Plus, Minus, Trash2, Printer, FileText, Download, X, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import BarcodeScannerModal from './BarcodeScannerModal';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import ProductGrid from './ProductGrid';
import ReceiptModal from './ReceiptModal';
import { SaleLog } from '../db';

export default function POS() {
  const location = useLocation();
  const navigate = useNavigate();
  const reversalSale = location.state?.reversalSale;
  const authorizer = location.state?.authorizer;
  const [completedSale, setCompletedSale] = useState<SaleLog | null>(null);

  const { settings, currentUser } = useAppContext();
  const products = useLiveQuery(() => db.products.toArray()) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (reversalSale) {
      setCart(reversalSale.items);
      setDiscount(reversalSale.discount);
      setCustomerName(reversalSale.customerName || 'Walk-in Customer');
      setPaymentMethod(reversalSale.paymentMethod);
    }
  }, [reversalSale]);


  useBarcodeScanner((barcode) => {
    // If exact product matches barcode, add it directly to cart
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    } else {
      // Otherwise set search term
      setSearchTerm(barcode);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discount, paymentMethod, customerName, currentUser]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id!,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitSellingPrice,
        unitOrderPrice: product.unitOrderPrice,
        totalPrice: product.unitSellingPrice
      }];
    });
    // On mobile, automatically close catalog after adding an item to see the cart, or leave it open?
    // Usually better to leave it open so they can add multiple items, but we can show a brief success state.
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPayable = Math.max(0, subTotal - discount);

  const isReversal = !!reversalSale;

  const handleCheckout = async (isQuotation = false) => {
    if (cart.length === 0) return;
    if (!currentUser) {
      alert("Please select a user to process this transaction.");
      return;
    }

    if (isReversal) {
      if (!window.confirm('Are you sure you want to process this reversal?')) return;
      try {
                await withAuditLog(currentUser, 'REVERSE_SALE', `Reversed Sale #${reversalSale.id} authorized by ${authorizer?.name}`, async () => {
           await db.sales.update(reversalSale.id, { status: 'reversed_original' });
           
           const reversalRecord = {
              timestamp: Date.now(),
              items: cart,
              subTotal: subTotal,
              discount: discount,
              totalAmount: totalPayable,
              paymentMethod,
              salespersonId: authorizer?.id || currentUser.id,
              salespersonName: authorizer?.name || currentUser.name,
              status: 'reversed' as const,
              customerName: `Reversal of #${reversalSale.id}`
           };
           await db.sales.add(reversalRecord);
           
           // restore inventory
           for (const item of cart) {
              const product = await db.products.get(item.productId);
              if (product && product.type === 'product') {
                await db.products.update(item.productId, {
                   quantity: product.quantity + item.quantity
                });
              }
           }
        });
        alert(`The sale for receipt number ${reversalSale.id} has been successfully reversed.`);
        setCart([]);
        setDiscount(0);
        navigate('/sales-history', { replace: true });
      } catch(err) {
        console.error(err);
        alert('Failed to reverse sale');
      }
      return;
    }

    try {
      let saleObj: any = null;
      await withAuditLog(currentUser, isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE', `Processed ${isQuotation ? 'quotation' : 'sale'} for ${totalPayable.toFixed(2)} (${cart.length} items)`, async () => {
        saleObj = {
          timestamp: Date.now(),
          items: cart,
          subTotal,
          discount,
          totalAmount: totalPayable,
          paymentMethod,
          salespersonId: currentUser.id!,
          salespersonName: currentUser.name,
          status: isQuotation ? 'quotation' : 'completed',
          customerName
        };
        const saleId = await db.sales.add(saleObj);
        saleObj.id = saleId;

        if (!isQuotation) {
          // Deduct inventory
          for (const item of cart) {
            const product = await db.products.get(item.productId);
            if (product && product.type === 'product') {
              await db.products.update(item.productId, {
                quantity: Math.max(0, product.quantity - item.quantity)
              });
            }
          }
        }
      });
      
      if (!isQuotation) {
         setCompletedSale(saleObj);
      } else {
         alert('Quotation Saved!');
      }
      
      setCart([]);
      setDiscount(0);
      setCustomerName('Walk-in Customer');
    } catch (error) {
      console.error(error);
      alert('Transaction failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Desktop Products Grid */}
      <div className="hidden lg:flex flex-1 flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ProductGrid 
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddToCart={addToCart}
          onOpenScanner={() => setIsScannerOpen(true)}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-96 flex flex-1 lg:flex-none flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h4 className="font-bold">Current Sale</h4>
          <div className="flex items-center gap-2">
            {/* Mobile Add to checkout button */}
            <button 
              onClick={() => setIsMobileCatalogOpen(true)}
              className="lg:hidden flex items-center bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <ShoppingBag size={14} className="mr-1" />
              Add to checkout
            </button>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded font-mono hidden sm:inline-block">{format(new Date(), 'HH:mm')}</span>
          </div>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <input 
            type="text" 
            placeholder="Customer Name (Optional)" 
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-50 text-slate-300" />
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-bold text-slate-700 truncate">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">${item.unitPrice.toFixed(2)} x {item.quantity}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-500 hover:text-slate-800"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-500 hover:text-slate-800"><Plus size={14} /></button>
                  </div>
                  <span className="font-black text-sm w-12 text-right text-slate-800">${item.totalPrice.toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
          <div className="flex justify-between text-sm text-slate-600 font-medium">
            <span>Sub-Total</span>
            <span className="font-bold">${subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-slate-600">Discount ($)</span>
            <input 
              type="number" 
              min="0"
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-tight">Total Payable</span>
            <span className="font-black text-2xl text-emerald-600">${totalPayable.toFixed(2)}</span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Payment Method</label>
            <select 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option>Cash</option>
              <option>Card (USD)</option>
              <option>Card (ZiG)</option>
              <option>Ecocash</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button 
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0}
              className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isReversal ? 'Complete Reversal' : 'Process Sale (F2)'}
            </button>
            {!isReversal && (
              <button 
                onClick={() => handleCheckout(true)}
                disabled={cart.length === 0}
                className="flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <FileText size={16} className="mr-2" />
                Quote
              </button>
            )}
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                disabled={cart.length === 0}
                className="flex-1 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Printer size={16} className="mr-1" />
                Print
              </button>
              <button 
                onClick={() => {
                  const sale = {
                    items: cart,
                    discount,
                    totalAmount: totalPayable,
                    paymentMethod,
                    customerName,
                    salespersonName: currentUser?.name,
                    timestamp: Date.now()
                  };
                  import('../utils/pdf').then(m => m.generateReceiptPDF(sale, settings));
                }}
                disabled={cart.length === 0}
                className="flex-1 flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={16} className="mr-1" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Catalog Modal */}
      {isMobileCatalogOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 flex flex-col pt-10">
          <div className="bg-white flex-1 rounded-t-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Select Items</h3>
              <button 
                onClick={() => setIsMobileCatalogOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <ProductGrid 
              products={products}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddToCart={addToCart}
              onOpenScanner={() => setIsScannerOpen(true)}
              searchInputRef={searchInputRef}
            />
          </div>
        </div>
      )}

      {/* Hidden Printable Receipt */}
      <div id="printable-receipt" className="hidden p-8 max-w-sm mx-auto bg-white text-black">
        <div className="text-center mb-6">
          {settings.logo && (
            <div className="flex justify-center mb-2">
              <img src={settings.logo} alt="Logo" className="h-12 object-contain" />
            </div>
          )}
          <h2 className="text-2xl font-bold">{settings.businessName}</h2>
          <p className="text-sm">{settings.motto}</p>
          <p className="text-sm mt-2">{settings.phone}</p>
          {settings.vatNumber && <p className="text-sm">TIN: {settings.vatNumber}</p>}
        </div>
        
        <h3 className="text-center font-bold text-lg mb-4 uppercase border-b-2 border-black pb-2">INVOICE</h3>
        
        <div className="flex justify-between text-sm mb-4">
          <div>
            <p>Date: {format(new Date(), 'dd/MM/yyyy')}</p>
            <p>Customer: {customerName}</p>
          </div>
          <div className="text-right">
            <p>Time: {format(new Date(), 'HH:mm')}</p>
            <p>Sales By: {currentUser?.name}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 pr-2">{item.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black pt-2 text-sm space-y-1">
          <div className="flex justify-between"><span className="font-bold">Sub-Total:</span><span>${subTotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between"><span className="font-bold">Discount:</span><span>${discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold mt-2"><span className="font-bold">Total Payable:</span><span>${totalPayable.toFixed(2)}</span></div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-black text-sm">
          <p>Payment Type: {paymentMethod}</p>
          <p className="mt-4 text-center font-bold">Note: Please Come Again</p>
        </div>
      </div>

      {isScannerOpen && (
        <BarcodeScannerModal 
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            const product = products.find(p => p.barcode === code);
            if (product) {
              addToCart(product);
            } else {
              setSearchTerm(code);
            }
            setIsScannerOpen(false);
          }}
        />
      )}
    
      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </div>
  );
}
function ShoppingCartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
