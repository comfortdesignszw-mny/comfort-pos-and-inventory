const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');
code = code.replace(
  /className="absolute bottom-10 left-1\/2 -translate-x-1\/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm z-50 transition-all animate-bounce"/,
  'className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm z-50 transition-all animate-bounce pointer-events-none"'
);
fs.writeFileSync('src/components/POS.tsx', code);
