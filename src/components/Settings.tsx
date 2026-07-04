import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Save, Store, Image as ImageIcon, Database, Download, Upload, AlertCircle } from 'lucide-react';
import { db } from '../db';

export default function Settings() {
  const { settings, updateSettings } = useAppContext();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
    setIsSaved(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportData = async () => {
    try {
      const products = await db.products.toArray();
      const sales = await db.sales.toArray();
      const staff = await db.staff.toArray();
      
      const data = {
        products,
        sales,
        staff,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comfort-pos-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm("WARNING: Importing data will overwrite your current data. Do you want to proceed?")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setImportStatus('Reading file...');
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.products || !data.sales || !data.staff) {
        throw new Error("Invalid backup file format");
      }
      
      setImportStatus('Importing data...');
      
      await db.transaction('rw', db.products, db.sales, db.staff, async () => {
        await db.products.clear();
        await db.sales.clear();
        await db.staff.clear();
        
        if (data.products.length) await db.products.bulkAdd(data.products);
        if (data.sales.length) await db.sales.bulkAdd(data.sales);
        if (data.staff.length) await db.staff.bulkAdd(data.staff);
      });
      
      setImportStatus('Import successful! Data has been restored.');
      setTimeout(() => setImportStatus(''), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error("Import failed:", error);
      setImportStatus(`Import failed: ${error.message}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Business Settings</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <Store className="w-5 h-5 text-slate-400 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Business Profile</h3>
          </div>
          
          <div className="mb-6 flex items-center space-x-4">
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <ImageIcon size={24} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Business Logo</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Business Name</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Motto</label>
              <input type="text" name="motto" value={formData.motto} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">VAT Number</label>
              <input type="text" name="vatNumber" value={formData.vatNumber} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-5 h-5 text-slate-400 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Inventory Settings</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Low Stock Alert Threshold</label>
              <input type="number" name="lowStockThreshold" min="0" value={formData.lowStockThreshold} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="text-xs text-slate-400 mt-1">Get notified when product stock falls to this number or below.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm">
            <Save size={18} className="mr-2" />
            {isSaved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-slate-400 mr-2" />
          <h3 className="text-lg font-bold text-slate-800">Data Management</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <button 
            onClick={handleExportData}
            type="button"
            className="flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Download size={16} className="mr-2" />
            Export Backup (JSON)
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".json"
              onChange={handleImportData}
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button 
              type="button"
              className="flex items-center justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm pointer-events-none"
            >
              <Upload size={16} className="mr-2" />
              Import Backup
            </button>
          </div>
        </div>
        {importStatus && (
          <p className={`mt-3 text-sm font-bold ${importStatus.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
            {importStatus}
          </p>
        )}
      </div>
    </div>
  );
}
