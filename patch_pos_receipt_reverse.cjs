const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

if (!code.includes('import { useLocation, useNavigate }')) {
  code = code.replace(/import React, \{ useState, useRef, useEffect \} from 'react';/, "import React, { useState, useRef, useEffect } from 'react';\nimport { useLocation, useNavigate } from 'react-router-dom';");
}

if (!code.includes('import ReceiptModal')) {
  code = code.replace(/import ProductGrid from '\.\/ProductGrid';/, "import ProductGrid from './ProductGrid';\nimport ReceiptModal from './ReceiptModal';\nimport { SaleLog } from '../db';");
}

code = code.replace(/export default function POS\(\) \{/, `export default function POS() {
  const location = useLocation();
  const navigate = useNavigate();
  const reversalSale = location.state?.reversalSale;
  const authorizer = location.state?.authorizer;
  const [completedSale, setCompletedSale] = useState<SaleLog | null>(null);
`);

// Inside POS(), add useEffect for reversalSale
code = code.replace(/const searchInputRef = useRef<HTMLInputElement>\(null\);/, `const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (reversalSale) {
      setCart(reversalSale.items);
      setDiscount(reversalSale.discount);
      setCustomerName(reversalSale.customerName || 'Walk-in Customer');
      setPaymentMethod(reversalSale.paymentMethod);
    }
  }, [reversalSale]);
`);

// Fix Process Sale
code = code.replace(/const handleProcessSale = async \(isQuotation: boolean = false\) => \{/, `const isReversal = !!reversalSale;

  const handleProcessSale = async (isQuotation: boolean = false) => {`);

// Now replace the inside of handleProcessSale
// Note: we had `await withAuditLog(...)`
// I'll replace the entire function to be safe.
const handleProcessSaleCode = `const isReversal = !!reversalSale;

  const handleProcessSale = async (isQuotation: boolean = false) => {
    if (cart.length === 0) return;
    
    if (isReversal) {
      if (!window.confirm('Are you sure you want to process this reversal?')) return;
      try {
        await withAuditLog(currentUser, 'REVERSE_SALE', \`Reversed Sale #\${reversalSale.id} authorized by \${authorizer?.name}\`, async () => {
           await db.sales.update(reversalSale.id, { status: 'reversed' });
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
        alert('Sale Reversed Successfully!');
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
      const saleObj = {
        timestamp: Date.now(),
        items: cart,
        subTotal,
        discount,
        totalAmount: totalPayable,
        paymentMethod,
        salespersonId: currentUser.id!,
        salespersonName: currentUser.name,
        status: isQuotation ? 'quotation' : 'completed' as any,
        customerName
      };

      await withAuditLog(currentUser, isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE', \`Processed \${isQuotation ? 'quotation' : 'sale'} for $\${totalPayable.toFixed(2)} (\${cart.length} items)\`, async () => {
        const saleId = await db.sales.add(saleObj);
        saleObj.id = saleId;

        if (!isQuotation) {
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
         setCompletedSale(saleObj as any);
      } else {
         alert('Quotation Saved!');
      }
      setCart([]);
      setDiscount(0);
      setCustomerName('Walk-in Customer');
    } catch (error) {
      console.error("Sale processing error:", error);
      alert('Failed to process sale. Please try again.');
    }
  };`;

// Replace handleProcessSale
// Because `handleProcessSale` is multi-line, we'll use a regex matching up to the end of it
code = code.replace(/const handleProcessSale = async \([\s\S]*?catch \(error\) \{\s*console\.error\("Sale processing error:", error\);\s*alert\('Failed to process sale. Please try again.'\);\s*\}\s*\};/, handleProcessSaleCode);

// Add the receipt modal to the render
code = code.replace(/<\/div>\s*\)\;\s*\}\s*$/m, `
      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </div>
  );
}`);

// Change "Process Sale" text
code = code.replace(/<span className="hidden sm:inline">Process Sale<\/span>/, `<span className="hidden sm:inline">{isReversal ? 'Complete Reversal' : 'Process Sale'}</span>`);
code = code.replace(/<span className="sm:hidden">Process<\/span>/, `<span className="sm:hidden">{isReversal ? 'Reverse' : 'Process'}</span>`);

// Hide Quotation button during reversal
code = code.replace(/<button\s*onClick=\{[^}]*\}\s*disabled=\{cart\.length === 0\}\s*className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 border border-slate-200 shrink-0"\s*title="Save as Quotation"\s*>\s*<FileText size=\{20\} \/>\s*<\/button>/m, `{!isReversal && (
              <button 
                onClick={() => handleProcessSale(true)} 
                disabled={cart.length === 0}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 border border-slate-200 shrink-0"
                title="Save as Quotation"
              >
                <FileText size={20} />
              </button>
            )}`);

fs.writeFileSync('src/components/POS.tsx', code);
