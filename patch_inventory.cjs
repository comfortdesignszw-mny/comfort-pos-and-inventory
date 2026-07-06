const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf-8');

code = code.replace(/import \{ useAppContext \} from '\.\.\/AppContext';/, `import { useAppContext } from '../AppContext';\nimport { withAuditLog } from '../utils/audit';`);

code = code.replace(/await db\.products\.bulkAdd\(newProducts\);\s*await logAction\('IMPORT_INVENTORY', `Imported \$\{newProducts\.length\} items`\);/g, `await withAuditLog(currentUser, 'IMPORT_INVENTORY', \`Imported \${newProducts.length} items\`, async () => {\n              await db.products.bulkAdd(newProducts);\n            });`);

code = code.replace(/const logAction = async \([\s\S]*?^\s*\};\s*$/m, '');

code = code.replace(/if \(editingItem\.id\) \{\s*await db\.products\.update\(editingItem\.id, editingItem\);\s*await logAction\('UPDATE_INVENTORY', `Updated item: \$\{editingItem\.name\}`\);\s*\} else \{\s*await db\.products\.add\(editingItem\);\s*await logAction\('ADD_INVENTORY', `Added item: \$\{editingItem\.name\}`\);\s*\}/g, `if (editingItem.id) {\n        await withAuditLog(currentUser, 'UPDATE_INVENTORY', \`Updated item: \${editingItem.name}\`, async () => {\n          await db.products.update(editingItem.id!, editingItem);\n        });\n      } else {\n        await withAuditLog(currentUser, 'ADD_INVENTORY', \`Added item: \${editingItem.name}\`, async () => {\n          await db.products.add(editingItem);\n        });\n      }`);

code = code.replace(/if \(window\.confirm\("Are you sure you want to delete this item\?"\)\) \{\s*await db\.products\.delete\(id\);\s*await logAction\('DELETE_INVENTORY', `Deleted item: \$\{name\}`\);\s*\}/g, `if (window.confirm("Are you sure you want to delete this item?")) {\n      await withAuditLog(currentUser, 'DELETE_INVENTORY', \`Deleted item: \${name}\`, async () => {\n        await db.products.delete(id);\n      });\n    }`);

fs.writeFileSync('src/components/Inventory.tsx', code);
