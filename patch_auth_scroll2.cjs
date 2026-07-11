const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-8 overflow-y-auto">/,
  `<div className="min-h-[100dvh] bg-slate-50 overflow-y-auto flex flex-col items-center p-4">
      <div className="flex-1 w-full max-w-md flex flex-col justify-center min-h-full py-6">`
);

code = code.replace(
  /<motion\.div \s*animate=\{shake \? \{ x: \[-10, 10, -10, 10, 0\] \} : \{\}\}\s*transition=\{\{ duration: 0\.4 \}\}\s*className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-auto shrink-0"\s*>/,
  `<motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 shrink-0"
        >`
);

code = code.replace(
  /<\/motion\.div>\s*<p className="text-slate-400 font-medium text-xs mt-8">Comfort POS \&copy; \{new Date\(\)\.getFullYear\(\)\}<\/p>\s*<\/div>/,
  `</motion.div>
        <p className="text-slate-400 font-medium text-xs mt-8 text-center">Comfort POS &copy; {new Date().getFullYear()}</p>
      </div>
    </div>`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
