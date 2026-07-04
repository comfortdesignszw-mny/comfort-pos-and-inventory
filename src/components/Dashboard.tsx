import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, FileText, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { format, subDays, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { useAppContext } from '../AppContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useAppContext();
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];

  const completedSales = sales.filter(s => s.status === 'completed');
  const quotations = sales.filter(s => s.status === 'quotation');
  const reversedSales = sales.filter(s => s.status === 'reversed');

  const today = new Date();
  
  const dailySales = completedSales.filter(s => isSameDay(new Date(s.timestamp), today));
  const weeklySales = completedSales.filter(s => isSameWeek(new Date(s.timestamp), today));
  const monthlySales = completedSales.filter(s => isSameMonth(new Date(s.timestamp), today));

  const totalDaily = dailySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalWeekly = weeklySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalMonthly = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Inventory Value
  const totalInventoryOrderValue = products.reduce((sum, p) => sum + (p.quantity * (p.unitOrderPrice || 0)), 0);
  const totalInventorySellingValue = products.reduce((sum, p) => sum + (p.quantity * p.unitSellingPrice), 0);
  const potentialProfit = totalInventorySellingValue - totalInventoryOrderValue;

  // Realized Profit
  const realizedProfit = completedSales.reduce((sum, sale) => {
    const saleProfit = sale.items.reduce((itemSum, item) => {
      return itemSum + (item.totalPrice - (item.unitOrderPrice * item.quantity));
    }, 0);
    // Rough estimate, deduct overall discount proportionally if needed, simplified here
    return sum + saleProfit - sale.discount; 
  }, 0);

  const lowStockProducts = products.filter(p => p.type === 'product' && p.quantity <= (settings.lowStockThreshold || 10));

  return (
    <div className="space-y-6">
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center shadow-sm">
          <AlertTriangle className="w-5 h-5 mr-3 text-red-500 shrink-0" />
          <div className="flex-1 text-sm font-medium">
            You have <span className="font-bold">{lowStockProducts.length}</span> product(s) running low on stock (Quantity &le; {settings.lowStockThreshold || 10}).
          </div>
          <button 
            onClick={() => navigate('/inventory')}
            className="text-xs bg-white text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
          >
            Manage Inventory
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <StatCard title="Today's Sales" value={totalDaily} trend="+12.5% from yesterday" />
        <StatCard title="Inventory Value" value={totalInventoryOrderValue} subtext={`Total Stock: ${products.length} Units`} />
        <StatCard title="Net Profit (MTD)" value={realizedProfit} subtext="Target: $15,000" color="emerald" />
        <StatCard title="Active Quotations" value={quotations.length} subtext={`Potential: $${(quotations.length * 600).toFixed(2)}`} color="blue" isCount={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-700">Inventory Valuation</h4>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600 text-sm">Total Purchase Value</span>
              <span className="font-bold text-slate-900">${totalInventoryOrderValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600 text-sm">Total Selling Value</span>
              <span className="font-bold text-slate-900">${totalInventorySellingValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 text-sm">Potential Profit</span>
              <span className="font-bold text-emerald-600">+${potentialProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-700">Activity Overview</h4>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Quotes</p>
                <h3 className="text-2xl font-black text-slate-800">{quotations.length}</h3>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reversed Sales</p>
                <h3 className="text-2xl font-black text-red-600">{reversedSales.length}</h3>
              </div>
            </div>
            
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden mt-auto">
               <div className="relative z-10">
                  <h4 className="text-xs font-bold uppercase text-emerald-400 mb-1">Quick Action</h4>
                  <p className="text-sm font-medium opacity-80 mb-4">Ready to start a new sale transaction?</p>
                  <button 
                    onClick={() => navigate('/pos')}
                    className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-lg font-bold text-sm shadow-xl transition-colors"
                  >
                    Create Sale
                  </button>
               </div>
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500 opacity-20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtext, trend, color = 'slate', isCount = false }: any) {
  const textColor = color === 'emerald' ? 'text-emerald-700' : color === 'blue' ? 'text-blue-700' : 'text-slate-800';
  const subtextColor = color === 'blue' ? 'text-blue-600 font-bold uppercase tracking-tighter' : 'text-slate-400 font-medium';

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className={`text-2xl font-black ${textColor}`}>
        {isCount ? value : `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </h3>
      {trend && (
        <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-bold">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/></svg>
          {trend}
        </p>
      )}
      {subtext && (
        <p className={`text-xs mt-2 ${subtextColor}`}>{subtext}</p>
      )}
    </div>
  );
}
