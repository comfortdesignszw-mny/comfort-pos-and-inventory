const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<div className="min-h-\[100dvh\] bg-slate-50 overflow-y-auto flex flex-col items-center p-4">/,
  `<div className="min-h-[100dvh] bg-slate-50 p-4 overflow-y-auto">\n      <div className="min-h-[calc(100dvh-2rem)] flex flex-col justify-center items-center">`
);

code = code.replace(
  /<div className="w-full max-w-md my-auto py-6">/,
  `<div className="w-full max-w-md py-6">`
);

code = code.replace(
  /<\/div>\s*<\/div>\s*$/m,
  `      </div>\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
