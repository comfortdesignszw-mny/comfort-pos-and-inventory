import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import { initializeDatabase } from './db';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import StaffList from './components/Staff';
import Settings from './components/Settings';
import AuthScreen from './components/AuthScreen';

function AppContent() {
  const { currentUser, logoutUser } = useAppContext();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      // Auto logout after 5 minutes of inactivity
      timeout = setTimeout(() => {
        if (currentUser) {
          logoutUser();
        }
      }, 5 * 60 * 1000); 
    };

    if (currentUser) {
      resetTimeout();
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      window.addEventListener('click', resetTimeout);
      window.addEventListener('scroll', resetTimeout);
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('scroll', resetTimeout);
    };
  }, [currentUser, logoutUser]);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsInitializing(false);
    }).catch(console.error);
  }, []);

  if (isInitializing) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-emerald-600 font-bold">Initializing Comfort POS...</div>;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
