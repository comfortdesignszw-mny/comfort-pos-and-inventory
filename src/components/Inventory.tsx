import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Product } from '../db';
import { Search, Plus, Edit2, Trash2, Share2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function Inventory() {
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'product' | 'service'>('product');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);

  const filteredItems = products.filter(p => 
    p.type === activeTab && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const logAction = async (action: string, details: string) => {
    if (currentUser?.id) {
      await db.auditLogs.add({
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        details,
        timestamp: Date.now()
      });
    }
  };

  const openModal = (item?: Product) => {
    setEditingItem(item || {
      name: '',
      description: '',
      quantity: 0,
      unitOrderPrice: 0,
      unitSellingPrice: 0,
      type: activeTab
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      if (editingItem.id) {
        await db.products.update(editingItem.id, editingItem);
        await logAction('UPDATE_INVENTORY', `Updated item: ${editingItem.name}`);
      } else {
        await db.products.add(editingItem);
        await logAction('ADD_INVENTORY', `Added item: ${editingItem.name}`);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await db.products.delete(id);
      await logAction('DELETE_INVENTORY', `Deleted item: ${name}`);
    }
  };

  const handleShare = async (item: Product) => {
    const text = `${item.name}\n${item.description}\nPrice: $${item.unitSellingPrice.toFixed(2)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: text,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert(`Share this product:\n\n${text}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'product' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('product')}
          >
            Products
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'service' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('service')}
          >
            Services
          </button>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}s...`}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add {activeTab === 'product' ? 'Product' : 'Service'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
              {activeTab === 'product' && (
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Qty</th>
              )}
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Price</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Price</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100 text-sm text-slate-600">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-slate-800">{item.name}</div>
                      <div className="text-sm text-slate-500 truncate w-48 font-medium">{item.description}</div>
                    </div>
                  </div>
                </td>
                {activeTab === 'product' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold uppercase rounded ${item.quantity > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.quantity} in stock
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  ${item.unitOrderPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                  ${item.unitSellingPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                  <button onClick={() => handleShare(item)} className="text-slate-500 hover:text-emerald-600 mr-3" title="Share"><Share2 size={16} /></button>
                  <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-900 mr-3"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id!, item.name)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No {activeTab}s found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem.id ? 'Edit' : 'Add'} {activeTab === 'product' ? 'Product' : 'Service'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Name</label>
                <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
              </div>
              
              {activeTab === 'product' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Quantity</label>
                  <input required type="number" min="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: Number(e.target.value)})} />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Order Price ($)</label>
                  <input required type="number" step="0.01" min="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingItem.unitOrderPrice} onChange={e => setEditingItem({...editingItem, unitOrderPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Selling Price ($)</label>
                  <input required type="number" step="0.01" min="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingItem.unitSellingPrice} onChange={e => setEditingItem({...editingItem, unitSellingPrice: Number(e.target.value)})} />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
