const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

code = code.replace(
  /<th className="px-6 py-3 text-left text-\[10px\] font-bold text-slate-400 uppercase tracking-wider">Date<\/th>/,
  `<th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>`
);

code = code.replace(
  /<td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">\s*\{format\(new Date\(sale.timestamp\), 'dd MMM yyyy, HH:mm'\)\}\s*<\/td>/,
  `<td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                  {format(new Date(sale.timestamp), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`px-2 py-0.5 inline-flex text-[10px] font-bold uppercase rounded \${
                    sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    sale.status === 'reversed' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }\`}>
                    {sale.status === 'completed' ? 'Sale' : sale.status === 'reversed' ? 'Reversed Sale' : 'Quotation'}
                  </span>
                </td>`
);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
