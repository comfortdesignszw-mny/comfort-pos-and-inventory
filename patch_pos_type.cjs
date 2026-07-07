const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

code = code.replace(
  /status: 'reversed',/g,
  `status: 'reversed' as const,`
);

fs.writeFileSync('src/components/POS.tsx', code);
