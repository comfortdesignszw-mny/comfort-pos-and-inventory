const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

code = code.replace(
  /sale\.status === 'reversed' \? 'bg-red-100 text-red-700' :/g,
  `sale.status.startsWith('reversed') ? 'bg-red-100 text-red-700' :`
);

code = code.replace(
  /sale\.status === 'reversed' \? 'Reversed Sale' :/g,
  `sale.status === 'reversed' ? 'Reversal Entry' : sale.status === 'reversed_original' ? 'Reversed Sale' :`
);

code = code.replace(
  /if \(sale\.status === 'reversed'\) return;/g,
  `if (sale.status.startsWith('reversed')) return;`
);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
