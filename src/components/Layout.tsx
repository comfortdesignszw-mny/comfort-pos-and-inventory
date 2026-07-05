import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, Menu, X, WifiOff, Download, History, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function Layout() {
  const { settings, updateSettings, currentUser, setCurrentUser, logoutUser, staffList } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  
  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };
  
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const checkDeferredPrompt = () => {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }
    };
    
    checkDeferredPrompt();
    window.addEventListener('deferredpromptready', checkDeferredPrompt);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // Check if device is iOS and not running as standalone PWA
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
    }
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('deferredpromptready', checkDeferredPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Manager'] },
    { to: '/pos', icon: ShoppingCart, label: 'POS', roles: ['Admin', 'Manager', 'Salesperson'] },
    { to: '/inventory', icon: Package, label: 'Inventory', roles: ['Admin', 'Manager'] },
    { to: '/sales-history', icon: History, label: 'Sales History', roles: ['Admin', 'Manager'] },
    { to: '/staff', icon: Users, label: 'Staff', roles: ['Admin', 'Manager'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['Admin'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser?.role || ''));

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col shrink-0 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-bold shrink-0">
            {settings.businessName.charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-semibold text-lg tracking-tight truncate">
            {settings.businessName}
          </span>
          <button className="lg:hidden text-slate-400 ml-auto" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </nav>
          
        {(deferredPrompt || isIOS) && (
          <div className="p-4 border-t border-slate-800">
            <div className="bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Offline Ready</span>
              </div>
              <button 
                onClick={handleInstallClick}
                className="w-full mt-2 bg-emerald-600 text-white text-xs font-semibold py-2 rounded shadow-lg hover:bg-emerald-700 transition-colors"
              >
                Install App
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-8 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center">
            <button className="text-slate-500 lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Dashboard Analytics</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase hidden sm:block">Current Session: {settings.branchName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-6">
            {(deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold shadow hover:bg-emerald-600"
              >
                Install App
              </button>
            )}
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700">{currentUser?.role}: {currentUser?.name}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase">
                System Status: {isOffline ? <span className="text-red-500">Offline</span> : 'Local DB Connected'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="Toggle Theme"
              >
                {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={logoutUser}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                Log Out
              </button>
              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                <span className="text-slate-500 text-sm font-bold">{currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-50 h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </main>

      {/* iOS Install Prompt Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                <img src="/icon-192x192.png" alt="App Icon" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Install Comfort POS</h3>
              <p className="text-sm text-slate-500 mb-6">
                Install this application on your home screen for quick and easy offline access.
              </p>
              
              <div className="bg-slate-50 w-full p-4 rounded-xl text-left border border-slate-100">
                <p className="text-sm text-slate-700 font-medium mb-3">To install on iOS:</p>
                <ol className="text-sm text-slate-600 space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs shrink-0">1</span>
                    <span>Tap the <strong className="text-blue-600">Share</strong> button in the Safari menu bar.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs shrink-0">2</span>
                    <span>Scroll down and tap <strong className="text-slate-800">"Add to Home Screen"</strong>.</span>
                  </li>
                </ol>
              </div>
              
              <button 
                onClick={() => setShowIOSPrompt(false)}
                className="mt-6 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
