import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Staff } from '../db';
import { Users, Shield, Award, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { withAuditLog } from '../utils/audit';

export default function StaffList() {
  const staff = useLiveQuery(() => db.staff.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const { currentUser, refreshStaff } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const isAdmin = currentUser?.role === 'Admin';
  const isManager = currentUser?.role === 'Manager';
  const canManageStaff = isAdmin || isManager;

  const handleOpenModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
    } else {
      setEditingStaff({
        name: '',
        role: 'Salesperson',
        pin: '0000'
      });
    }
    setIsModalOpen(true);
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      if (editingStaff.id) {
        await db.staff.update(editingStaff.id, editingStaff);
        await logAction('UPDATE_STAFF', `Updated staff: ${editingStaff.name}`);
      } else {
        await db.staff.add(editingStaff);
        await logAction('ADD_STAFF', `Added staff: ${editingStaff.name}`);
      }
      setIsModalOpen(false);
      refreshStaff();
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await db.staff.delete(id);
      await logAction('DELETE_STAFF', `Deleted staff: ${name}`);
      refreshStaff();
    }
  };

  const handleResetPin = async (user: Staff) => {
    if (window.confirm(`Are you sure you want to reset the PIN for ${user.name}?`)) {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      await db.staff.update(user.id!, { pin: newPin });
      alert(`The new PIN for ${user.name} is: ${newPin}\nPlease share it with them.`);
      await logAction('RESET_PIN', `Reset PIN for ${user.name}`);
      refreshStaff();
    }
  };

  const canEditStaff = (targetStaff: Staff) => {
    if (isAdmin) return true;
    if (isManager && targetStaff.role === 'Salesperson') return true;
    return false;
  };

  const canDeleteStaff = (targetStaff: Staff) => {
    if (targetStaff.id === currentUser?.id) return false; // Cannot delete self
    if (isAdmin) return true;
    if (isManager && targetStaff.role === 'Salesperson') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Staff & Performance</h2>
        {canManageStaff && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add Staff
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(user => {
          const userSales = sales.filter(s => s.salespersonId === user.id && s.status === 'completed');
          const totalSalesValue = userSales.reduce((sum, s) => sum + s.totalAmount, 0);

          return (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="p-6">
                <div className="flex items-center mb-4 justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xl mr-4 shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                      <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                        <Shield size={14} className="mr-1 text-slate-400" />
                        {user.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {isAdmin && user.id !== currentUser?.id && (
                      <button onClick={() => handleResetPin(user)} className="text-emerald-600 hover:text-emerald-900 p-1" title="Reset PIN">
                        <RefreshCw size={16} />
                      </button>
                    )}
                    {canEditStaff(user) && (
                      <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {canDeleteStaff(user) && (
                      <button onClick={() => handleDelete(user.id!, user.name)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Award size={14} className="mr-2" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Total Transactions</p>
                      <p className="text-xl font-black text-slate-800">{userSales.length}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Total Sales Value</p>
                      <p className="text-xl font-black text-emerald-600">${totalSalesValue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStaff.id ? 'Edit' : 'Add'} Staff
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 disabled:opacity-50"
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}
                  disabled={editingStaff.id === currentUser?.id}
                >
                  <option value="Salesperson">Salesperson</option>
                  {isAdmin && <option value="Manager">Manager</option>}
                  {isAdmin && <option value="Admin">Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">PIN (For Login)</label>
                <input required type="text" maxLength={4} pattern="[0-9]{4}" title="4 digit PIN" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800" value={editingStaff.pin} onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setEditingStaff({...editingStaff, pin: val});
                }} />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">System Audit Logs</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <AuditLogsTable />
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLogsTable() {
  const logs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(50).toArray()) || [];
  
  if (logs.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-medium">No audit logs found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wide">Time</th>
            <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
            <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
            <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wide">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-slate-50/50">
              <td className="py-3 px-6 text-sm text-slate-500 font-medium">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="py-3 px-6 text-sm font-bold text-slate-700">
                {log.userName}
              </td>
              <td className="py-3 px-6">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">
                  {log.action}
                </span>
              </td>
              <td className="py-3 px-6 text-sm text-slate-600">
                {log.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
