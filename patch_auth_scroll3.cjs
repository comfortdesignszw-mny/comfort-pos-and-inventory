const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<div className="flex-1 w-full max-w-md flex flex-col justify-center min-h-full py-6">/,
  `<div className="w-full max-w-md my-auto py-6">`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
