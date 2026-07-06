const fs = require('fs');
let code = fs.readFileSync('src/components/Staff.tsx', 'utf-8');

code = code.replace(/import \{ useAppContext \} from '\.\.\/AppContext';/, `import { useAppContext } from '../AppContext';\nimport { withAuditLog } from '../utils/audit';`);

code = code.replace(/if \(editingStaff\.id\) \{\s*await db\.staff\.update\(editingStaff\.id, editingStaff\);\s*\} else \{\s*await db\.staff\.add\(editingStaff\);\s*\}/g, `if (editingStaff.id) {\n        await withAuditLog(currentUser, 'UPDATE_STAFF', \`Updated staff: \${editingStaff.name}\`, async () => {\n          await db.staff.update(editingStaff.id!, editingStaff);\n        });\n      } else {\n        await withAuditLog(currentUser, 'ADD_STAFF', \`Added staff: \${editingStaff.name}\`, async () => {\n          await db.staff.add(editingStaff);\n        });\n      }`);

code = code.replace(/if \(window\.confirm\("Are you sure you want to delete this staff member\?"\)\) \{\s*await db\.staff\.delete\(id\);\s*\}/g, `if (window.confirm("Are you sure you want to delete this staff member?")) {\n      await withAuditLog(currentUser, 'DELETE_STAFF', \`Deleted staff: \${name}\`, async () => {\n        await db.staff.delete(id);\n      });\n    }`);

code = code.replace(/if \(window\.confirm\(`Reset PIN for \$\{user\.name\}\?`\)\) \{\s*await db\.staff\.update\(user\.id!, \{ pin: '0000' \}\);\s*alert\('PIN reset to 0000'\);\s*\}/g, `if (window.confirm(\`Reset PIN for \${user.name}?\`)) {\n      await withAuditLog(currentUser, 'RESET_STAFF_PIN', \`Reset PIN for: \${user.name}\`, async () => {\n        await db.staff.update(user.id!, { pin: '0000' });\n      });\n      alert('PIN reset to 0000');\n    }`);

fs.writeFileSync('src/components/Staff.tsx', code);
