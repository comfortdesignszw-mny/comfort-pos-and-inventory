import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

export default function InstallToast() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const checkDeferredPrompt = () => {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setShowToast(true);
      }
    };
    
    checkDeferredPrompt();
    window.addEventListener('deferredpromptready', checkDeferredPrompt);

    return () => {
      window.removeEventListener('deferredpromptready', checkDeferredPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowToast(false);
      }
    }
  };

  if (!showToast) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700 max-w-sm w-[90vw]">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold">Install Comfort POS</h4>
          <p className="text-xs text-slate-400">Add to home screen for offline use</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleInstallClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
          <button 
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
