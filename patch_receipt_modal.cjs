const fs = require('fs');
let code = fs.readFileSync('src/components/ReceiptModal.tsx', 'utf-8');

code = code.replace(/<div className="p-4 border-t border-slate-100 bg-white grid grid-cols-3 gap-2 shrink-0">/, `<div className="p-4 border-t border-slate-100 bg-white grid grid-cols-4 gap-2 shrink-0">`);

const closeButtonHtml = `
          <button onClick={onClose} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-50 border border-slate-200 text-red-600 font-bold text-xs transition-colors">
            <X size={18} className="mb-1" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
`;

code = code.replace(/<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\;\s*\}/m, `</button>\n${closeButtonHtml}`);

fs.writeFileSync('src/components/ReceiptModal.tsx', code);
