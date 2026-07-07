const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

const replacement = `const isReversal = !!reversalSale;

  const handleCheckout = async (isQuotation = false) => {
    if (cart.length === 0) return;
    if (!currentUser) {
      alert("Please select a user to process this transaction.");
      return;
    }

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
        alert(\`The sale for receipt number \${reversalSale.id} has been successfully reversed.\`);
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
      await withAuditLog(currentUser, isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE', \`Processed \${isQuotation ? 'quotation' : 'sale'} for $\${totalPayable.toFixed(2)} (\${cart.length} items)\`, async () => {
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
  };`;

// Replace handleCheckout block
code = code.replace(/const handleCheckout = async \(isQuotation = false\) => \{[\s\S]*?alert\('Transaction failed\.'\);\s*\}\s*\};/m, replacement);

fs.writeFileSync('src/components/POS.tsx', code);
