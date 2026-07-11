const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<div className="min-h-\[100dvh\] bg-slate-50 p-4 overflow-y-auto">/,
  `<div className="min-h-[100dvh] bg-slate-50 p-4 overflow-y-auto flex flex-col">`
);

code = code.replace(
  /<div className="min-h-\[calc\(100dvh-2rem\)\] flex flex-col justify-center items-center">/,
  `<div className="flex-1 shrink-0 min-h-[2rem]"></div>`
);

code = code.replace(
  /<div className="w-full max-w-md py-6">/,
  `<div className="w-full max-w-md mx-auto shrink-0 py-2">`
);

code = code.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*$/m,
  `      </div>\n      <div className="flex-1 shrink-0 min-h-[2rem]"></div>\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
