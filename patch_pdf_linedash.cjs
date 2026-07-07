const fs = require('fs');
let code = fs.readFileSync('src/utils/pdf.ts', 'utf-8');

code = code.replace(/doc\.setLineDash\(\[1, 1\], 0\);/, "");

fs.writeFileSync('src/utils/pdf.ts', code);
