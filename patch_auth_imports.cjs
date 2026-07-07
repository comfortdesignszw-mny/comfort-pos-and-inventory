const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');

code = code.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Moon, Sun } from 'lucide-react';");

fs.writeFileSync('src/components/AuthScreen.tsx', code);
