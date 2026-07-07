const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

if (!code.includes('const totalReversed = reversedSales.reduce')) {
  code = code.replace(/const totalMonthly = monthlySales\.reduce\(\(sum, s\) => sum \+ s\.totalAmount, 0\);/, "const totalMonthly = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);\n  const totalReversed = reversedSales.reduce((sum, s) => sum + s.totalAmount, 0);");
}

code = code.replace(/<h3 className="text-2xl font-black text-red-600">\{reversedSales\.length\}<\/h3>/, `<h3 className="text-2xl font-black text-red-600">{reversedSales.length}</h3>\n                <p className="text-[10px] text-red-500 font-bold mt-1">Value: $\${totalReversed.toFixed(2)}</p>`);

fs.writeFileSync('src/components/Dashboard.tsx', code);
