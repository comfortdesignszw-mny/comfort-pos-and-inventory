const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

code = code.replace(/const exportCSV = \(\) => \{[\s\S]*?m\.exportToCSV\(data, 'Sales_History\.csv'\);\s*\}\);\s*\};/, `const exportCSV = () => {
    import('../utils/export').then(m => {
      const data = sales.map(s => ({
        ID: s.id,
        Date: format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm'),
        Customer: s.customerName || 'Walk-in',
        Salesperson: s.salespersonName,
        Method: s.paymentMethod,
        Total: s.totalAmount,
        Items: s.items.map(i => \`\${i.name} (x\${i.quantity})\`).join(', ')
      }));
      m.exportToCSV(data, 'Full_Sales_History.csv');
    });
  };`);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
