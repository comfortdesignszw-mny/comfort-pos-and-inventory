const fs = require('fs');
let code = fs.readFileSync('src/components/POS.tsx', 'utf-8');

code = code.replace(
  /const \[isMobileCatalogOpen, setIsMobileCatalogOpen\] = useState\(false\);/,
  `const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);\n  const [toastMessage, setToastMessage] = useState<string | null>(null);\n  const toastTimerRef = useRef<any>(null);`
);

code = code.replace(
  /const addToCart = \(product: Product\) => \{/,
  `const addToCart = (product: Product) => {
    setToastMessage(\`\${product.name} added to checkout\`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);`
);

// Add toast UI at the end of the return statement before the last closing div.
// Wait, POS returns a top-level div with className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden relative"
// Let's add the toast as absolute
code = code.replace(
  /\{completedSale && \(\s*<ReceiptModal sale=\{completedSale\} onClose=\{\(\) => setCompletedSale\(null\)\} \/>\s*\)\}\s*<\/div>\s*\)\;\s*\}\s*$/m,
  `{completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
      
      {toastMessage && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm z-50 transition-all animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/components/POS.tsx', code);
