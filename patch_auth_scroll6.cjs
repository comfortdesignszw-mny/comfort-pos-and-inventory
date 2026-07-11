const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(
  /<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/m,
  `      </div>\n      <div className="flex-1 shrink-0 min-h-[2rem]"></div>\n    </div>\n  );\n}`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
