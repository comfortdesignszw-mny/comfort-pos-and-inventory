const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf-8');
code = code.replace(/const \{ staffList, refreshStaff, setCurrentUser, settings \} = useAppContext\(\);/, "const { staffList, refreshStaff, setCurrentUser, settings, updateSettings } = useAppContext();");
fs.writeFileSync('src/components/AuthScreen.tsx', code);
