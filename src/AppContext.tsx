import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, Staff } from './db';

interface AppSettings {
  businessName: string;
  motto: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
  regNumber: string;
  branches: string;
  branchName: string;
  logo: string;
  theme: string;
  lowStockThreshold: number;
}

const defaultSettings: AppSettings = {
  businessName: 'Comfort POS',
  motto: 'Your Complete Business Hub',
  phone: '0779324354',
  email: 'info@comfortpos.com',
  website: 'www.comfortpos.com',
  vatNumber: '2001714672',
  regNumber: '',
  branches: '1',
  branchName: 'Main Branch',
  logo: '',
  theme: 'light',
  lowStockThreshold: 10
};

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  currentUser: Staff | null;
  setCurrentUser: (user: Staff) => void;
  logoutUser: () => void;
  staffList: Staff[];
  refreshStaff: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('comfort_pos_settings_v2');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const loadStaff = async () => {
    const users = await db.staff.toArray();
    setStaffList(users);
  };

  useEffect(() => {
    localStorage.setItem('comfort_pos_settings_v2', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    loadStaff();
    
    // Check if there was a previously logged in user in this session
    const savedUserId = sessionStorage.getItem('comfort_pos_user_id');
    if (savedUserId) {
      db.staff.get(Number(savedUserId)).then(user => {
        if (user) setCurrentUser(user);
      });
    }
  }, []);

  const loginUser = (user: Staff) => {
    setCurrentUser(user);
    if (user.id) {
      sessionStorage.setItem('comfort_pos_user_id', user.id.toString());
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('comfort_pos_user_id');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, currentUser, setCurrentUser: loginUser, logoutUser, staffList, refreshStaff: loadStaff }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
