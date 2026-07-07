const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

if (!code.includes('import { useNavigate }')) {
  code = code.replace(/import React, \{ useState, useMemo \} from 'react';/, "import React, { useState, useMemo } from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport { RotateCcw } from 'lucide-react';");
}

code = code.replace(/export default function SalesHistory\(\) \{/, `export default function SalesHistory() {
  const navigate = useNavigate();
  const [reversalPinModal, setReversalPinModal] = useState<{isOpen: boolean, sale: SaleLog | null, pin: string}>({isOpen: false, sale: null, pin: ''});

  const handleReverseSaleClick = (e: React.MouseEvent, sale: SaleLog) => {
    e.stopPropagation();
    if (sale.status === 'reversed') return;
    setReversalPinModal({isOpen: true, sale, pin: ''});
  };

  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { sale, pin } = reversalPinModal;
    if (!sale) return;

    const validStaff = await db.staff.where('pin').equals(pin).first();
    if (!validStaff || (validStaff.role !== 'Manager' && validStaff.role !== 'Admin')) {
       alert("Invalid PIN or unauthorized role. Only Manager or Admin can authorize a reversal.");
       return;
    }

    setReversalPinModal({isOpen: false, sale: null, pin: ''});
    navigate('/pos', { state: { reversalSale: sale, authorizer: validStaff } });
  };
`);

code = code.replace(/<button \s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); handlePrint\(sale\); \}\}/, `{sale.status !== 'reversed' && (
                  <button 
                     onClick={(e) => handleReverseSaleClick(e, sale)} 
                     className="text-slate-500 hover:text-red-600 p-1 mr-2 rounded-md hover:bg-red-50 transition-colors"
                    title="Reverse Sale"
                  >
                    <RotateCcw size={18} />
                  </button>
                  )}
                  <button 
                     onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}`);

code = code.replace(/<button \s*onClick=\{\(\) => handlePrint\(selectedSale\)\}/, `{selectedSale.status !== 'reversed' && (
              <button 
                 onClick={(e) => handleReverseSaleClick(e as any, selectedSale)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors shadow-sm flex items-center"
              >
                <RotateCcw size={16} className="mr-2" />
                Reverse Sale
              </button>
              )}
              <button 
                 onClick={() => handlePrint(selectedSale)}`);

// Adding reversalPinModal render logic at the end of the component
code = code.replace(/<\/div>\s*\)\;\s*\}\s*$/m, `      
      {reversalPinModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Authorize Reversal</h3>
              <button onClick={() => setReversalPinModal({isOpen: false, sale: null, pin: ''})} className="text-slate-400 hover:text-red-500">
                &times;
              </button>
            </div>
            <form onSubmit={handleReversalSubmit} className="p-6">
              <p className="text-sm text-slate-600 mb-4">Enter an Admin or Manager PIN to authorize the reversal of Receipt #{reversalPinModal.sale?.id}.</p>
              <input
                type="password"
                required
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="Enter 4-digit PIN"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-800 mb-4 text-center tracking-widest text-lg"
                value={reversalPinModal.pin}
                onChange={e => setReversalPinModal({...reversalPinModal, pin: e.target.value.replace(/[^0-9]/g, '')})}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setReversalPinModal({isOpen: false, sale: null, pin: ''})} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Authorize</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}`);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
