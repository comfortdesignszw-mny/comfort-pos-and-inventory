import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { db, Staff } from '../db';
import { Shield, UserPlus, LogIn, Store, Delete, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthScreen() {
  const { staffList, refreshStaff, setCurrentUser, settings, updateSettings } = useAppContext();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const isSetupMode = staffList.length === 0;

  useEffect(() => {
    if (pin.length === 4 && selectedUserId && !isSetupMode) {
      handleLogin();
    }
  }, [pin, selectedUserId]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin('');
  };

  const handleSetup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!name || !pin || pin.length !== 4) {
      triggerError('Please provide a name and a 4-digit PIN.');
      return;
    }

    const adminUser: Staff = {
      name,
      pin,
      role: 'Admin'
    };

    const id = await db.staff.add(adminUser);
    const savedUser = await db.staff.get(id);
    
    if (savedUser) {
      await db.auditLogs.add({
        userId: savedUser.id!,
        userName: savedUser.name,
        action: 'SYSTEM_INIT',
        details: 'Admin user created',
        timestamp: Date.now()
      });
      await refreshStaff();
      setCurrentUser(savedUser);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!selectedUserId) {
      triggerError('Please select a user.');
      return;
    }
    
    if (pin.length !== 4) {
      triggerError('Please enter a 4-digit PIN.');
      return;
    }

    const user = await db.staff.get(Number(selectedUserId));
    if (user && user.pin === pin) {
      await db.auditLogs.add({
        userId: user.id!,
        userName: user.name,
        action: 'LOGIN',
        details: 'User logged in',
        timestamp: Date.now()
      });
      setCurrentUser(user);
    } else {
      triggerError('INCORRECT PIN');
    }
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };
  
  const handleNumpad = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-8 overflow-y-auto">
      <motion.div 
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-auto shrink-0"
      >
        <div className="bg-slate-900 p-8 text-center relative">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg">
            {settings.businessName ? settings.businessName.charAt(0).toUpperCase() : <Store size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-white">{settings.businessName || 'Comfort POS'}</h1>
          <p className="text-emerald-400 mt-2 font-medium">
            {isSetupMode ? 'System Initialization' : 'Staff Login'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-6 text-center uppercase tracking-wide">
              {error}
            </div>
          )}

          {isSetupMode ? (
            <form onSubmit={handleSetup} className="space-y-5">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-slate-800 font-bold text-lg">Create Admin Account</h3>
                <p className="text-slate-500 text-sm mt-1">Welcome! Let's set up the first administrator account.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Admin Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">4-Digit PIN</label>
                <div className="text-center mb-4">
                  <div className="flex justify-center gap-4 mb-4">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpad(num)}
                      className="py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button type="button" className="py-4 bg-slate-50 rounded-xl" disabled></button>
                  <button
                    type="button"
                    onClick={() => handleNumpad(0)}
                    className="py-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center mt-6">
                <UserPlus className="w-5 h-5 mr-2" />
                Initialize System
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select User</label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                >
                  <option value="">-- Select your name --</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">PIN</label>
                <div className="text-center mb-4">
                  <div className="flex justify-center gap-4 mb-4">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpad(num)}
                      className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button type="button" className="py-4 rounded-xl" disabled></button>
                  <button
                    type="button"
                    onClick={() => handleNumpad(0)}
                    className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xl text-slate-700 transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={handleLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center mt-6 shadow-md"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Access System
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <p className="text-slate-400 font-medium text-xs mt-8">Comfort POS &copy; {new Date().getFullYear()}</p>
    </div>
  );
}
