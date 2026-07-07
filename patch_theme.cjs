const fs = require('fs');
let code = fs.readFileSync('src/AppContext.tsx', 'utf-8');
code = code.replace(/theme: 'red',/, "theme: 'light',");
fs.writeFileSync('src/AppContext.tsx', code);
