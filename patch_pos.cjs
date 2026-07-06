const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

code = code.replace(/import \{ useAppContext \} from '\.\.\/AppContext';/, `import { useAppContext } from '../AppContext';\nimport { withAuditLog } from '../utils/audit';`);

code = code.replace(/try \{\s*const saleId = await db\.sales\.add\(\{([\s\S]*?)\}\);\s*await db\.auditLogs\.add\(\{([\s\S]*?)\}\);/m, `try {\n      await withAuditLog(currentUser, isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE', \`Processed \${isQuotation ? 'quotation' : 'sale'} for $\${totalPayable.toFixed(2)} (\${cart.length} items)\`, async () => {\n        const saleId = await db.sales.add({$1});`);

// Close the withAuditLog call
code = code.replace(/if \(\!isQuotation\) \{\s*\/\/ Deduct inventory/m, `\n      if (!isQuotation) {\n        // Deduct inventory`);

// Wait, the block was:
/*
    try {
      const saleId = await db.sales.add({
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
      });

      await db.auditLogs.add({
        userId: currentUser.id!,
        userName: currentUser.name,
        action: isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE',
        details: `Processed ${isQuotation ? 'quotation' : 'sale'} for $${totalPayable.toFixed(2)} (${cart.length} items)`,
        timestamp: Date.now()
      });

      if (!isQuotation) {
        // Deduct inventory
*/

code = code.replace(/try \{\s*const saleId = await db\.sales\.add\(\{\s*timestamp: Date\.now\(\),\s*items: cart,\s*subTotal,\s*discount,\s*totalAmount: totalPayable,\s*paymentMethod,\s*salespersonId: currentUser\.id!,\s*salespersonName: currentUser\.name,\s*status: isQuotation \? 'quotation' : 'completed',\s*customerName\s*\}\);\s*await db\.auditLogs\.add\(\{\s*userId: currentUser\.id!,\s*userName: currentUser\.name,\s*action: isQuotation \? 'CREATE_QUOTATION' : 'COMPLETE_SALE',\s*details: `Processed \$\{isQuotation \? 'quotation' : 'sale'\} for \$\$\{totalPayable\.toFixed\(2\)\} \(\$\{cart\.length\} items\)`,\s*timestamp: Date\.now\(\)\s*\}\);\s*if \(\!isQuotation\) \{/m, `try {\n      await withAuditLog(currentUser, isQuotation ? 'CREATE_QUOTATION' : 'COMPLETE_SALE', \`Processed \${isQuotation ? 'quotation' : 'sale'} for $\${totalPayable.toFixed(2)} (\${cart.length} items)\`, async () => {\n        const saleId = await db.sales.add({\n          timestamp: Date.now(),\n          items: cart,\n          subTotal,\n          discount,\n          totalAmount: totalPayable,\n          paymentMethod,\n          salespersonId: currentUser.id!,\n          salespersonName: currentUser.name,\n          status: isQuotation ? 'quotation' : 'completed',\n          customerName\n        });\n\n        if (!isQuotation) {`);

// Close the withAuditLog wrapper
code = code.replace(/alert\(isQuotation \? 'Quotation Saved!' : 'Sale Completed Successfully!'\);\s*setCart\(\[\]\);\s*setDiscount\(0\);\s*\} catch \(error\) \{/m, `});\n\n      alert(isQuotation ? 'Quotation Saved!' : 'Sale Completed Successfully!');\n      setCart([]);\n      setDiscount(0);\n    } catch (error) {`);

fs.writeFileSync('src/components/POS.tsx', code);
