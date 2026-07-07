const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

if (!code.includes('import { Moon, Sun } from')) {
  code = code.replace(/import \{ Store, Shield, LogIn, UserPlus, Delete \} from 'lucide-react';/, "import { Store, Shield, LogIn, UserPlus, Delete, Moon, Sun } from 'lucide-react';");
}

if (!code.includes('const toggleTheme =')) {
  code = code.replace(/const handleNumpad =/, `const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };
  
  const handleNumpad =`);
}

if (!code.includes('title="Toggle Theme"')) {
  code = code.replace(/<div className="bg-slate-900 p-8 text-center">/, `<div className="bg-slate-900 p-8 text-center relative">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>`);
}

fs.writeFileSync('src/components/AuthScreen.tsx', code);
