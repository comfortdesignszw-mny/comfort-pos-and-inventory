const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

const replacement = `        await withAuditLog(currentUser, 'REVERSE_SALE', \`Reversed Sale #\${reversalSale.id} authorized by \${authorizer?.name}\`, async () => {
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
              status: 'reversed',
              customerName: \`Reversal of #\${reversalSale.id}\`
           };
           await db.sales.add(reversalRecord);
           
           // restore inventory
           for (const item of cart) {`;

code = code.replace(/await withAuditLog\(currentUser, 'REVERSE_SALE', `Reversed Sale #\$\{reversalSale\.id\} authorized by \$\{authorizer\?\.name\}`, async \(\) => \{\n\s*await db\.sales\.update\(reversalSale\.id, \{ status: 'reversed' \}\);\n\s*\/\/ restore inventory\n\s*for \(const item of cart\) \{/, replacement);

fs.writeFileSync('src/components/POS.tsx', code);
