const fs = require('fs');
let code = fs.readFileSync('src/components/SalesHistory.tsx', 'utf-8');

code = code.replace(/const { settings } = useAppContext\(\);/, "const { settings, staffList } = useAppContext();");

code = code.replace(/const \[reversalPinModal, setReversalPinModal\] = useState<\{[^}]+\}>\(\{isOpen: false, sale: null, pin: ''\}\);/, `const [reversalPinModal, setReversalPinModal] = useState<{isOpen: boolean, sale: SaleLog | null, pin: string, authorizerId: string | number}>({isOpen: false, sale: null, pin: '', authorizerId: ''});`);

code = code.replace(/setReversalPinModal\(\{isOpen: true, sale, pin: ''\}\);/, "setReversalPinModal({isOpen: true, sale, pin: '', authorizerId: ''});");

code = code.replace(/const { sale, pin } = reversalPinModal;/, "const { sale, pin, authorizerId } = reversalPinModal;");

code = code.replace(/const validStaff = await db\.staff\.where\('pin'\)\.equals\(pin\)\.first\(\);/, `const validStaff = await db.staff.get(Number(authorizerId));
    if (!validStaff || validStaff.pin !== pin) {
       alert("Invalid Name or PIN.");
       return;
    }`);

code = code.replace(/setReversalPinModal\(\{isOpen: false, sale: null, pin: ''\}\);/g, "setReversalPinModal({isOpen: false, sale: null, pin: '', authorizerId: ''});");

const formReplacement = `
            <form onSubmit={handleReversalSubmit} className="p-6">
              <p className="text-sm text-slate-600 mb-4">Enter an Admin or Manager name and PIN to authorize the reversal of Receipt #{reversalPinModal.sale?.id}.</p>
              <select
                required
                value={reversalPinModal.authorizerId}
                onChange={e => setReversalPinModal({...reversalPinModal, authorizerId: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-800 mb-4"
              >
                <option value="">-- Select Manager / Admin --</option>
                {staffList.filter(s => s.role === 'Admin' || s.role === 'Manager').map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
              <input
                type="password"
                required
                maxLength={4}
                pattern="[0-9]{4}"
                placeholder="Enter 4-digit PIN"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-800 mb-4 text-center tracking-widest text-lg"
                value={reversalPinModal.pin}
                onChange={e => setReversalPinModal({...reversalPinModal, pin: e.target.value.replace(/[^0-9]/g, '')})}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setReversalPinModal({isOpen: false, sale: null, pin: '', authorizerId: ''})} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Authorize</button>
              </div>
            </form>
`;

// Replace the <form> inside the modal
code = code.replace(/<form onSubmit=\{handleReversalSubmit\} className="p-6">[\s\S]*?<\/form>/, formReplacement);

fs.writeFileSync('src/components/SalesHistory.tsx', code);
