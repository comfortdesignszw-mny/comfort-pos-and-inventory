const fs = require('fs');
let code = fs.readFileSync('src/utils/pdf.ts', 'utf-8');

code = code.replace(/item\.productName,/g, "item.name || item.productName,");
code = code.replace(/doc\.text\('Thank you!', 40, y, \{ align: 'center' \}\);/g, `doc.text('Thank you for shopping from us!', 40, y, { align: 'center' });\n  y += 5;\n  doc.setFontSize(8);\n  doc.text('Receipt processed by Comfort POS System', 40, y, { align: 'center' });`);

fs.writeFileSync('src/utils/pdf.ts', code);
