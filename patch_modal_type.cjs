const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

code = code.replace(
  /<p className="font-bold text-slate-700 capitalize">\{selectedSale\.status\}<\/p>/,
  `<p className="font-bold text-slate-700 capitalize">{selectedSale.status === 'completed' ? 'Sale' : selectedSale.status === 'reversed' ? 'Reversal Entry' : selectedSale.status === 'reversed_original' ? 'Reversed Sale' : 'Quotation'}</p>`
);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
