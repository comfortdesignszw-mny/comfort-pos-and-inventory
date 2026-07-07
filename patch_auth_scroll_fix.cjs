const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<div className="min-h-\[100dvh\] bg-slate-50 flex flex-col sm:justify-center items-center p-4 py-8 overflow-y-auto">/,
  `<div className="min-h-screen bg-slate-50 grid place-items-center p-4 overflow-y-auto">`
);

code = code.replace(
  /className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-auto"/,
  `className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-8"`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
