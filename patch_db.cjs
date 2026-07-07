const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf-8');

code = code.replace(
  /status: 'completed' \| 'quotation' \| 'reversed';/,
  `status: 'completed' | 'quotation' | 'reversed' | 'reversed_original';`
);

fs.writeFileSync('src/db.ts', code);
