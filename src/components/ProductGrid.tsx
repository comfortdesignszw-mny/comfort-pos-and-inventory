import React, { useRef, useState } from 'react';
import { Search, Scan } from 'lucide-react';
import { Product } from '../db';

interface ProductGridProps {
  products: Product[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenScanner: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export default function ProductGrid({ 
  products, 
  searchTerm, 
  setSearchTerm, 
  onAddToCart, 
  onOpenScanner,
  searchInputRef
}: ProductGridProps) {
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white lg:rounded-xl shadow-sm lg:border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-col sm:flex-row gap-3 shrink-0">
        <h4 className="font-bold text-slate-700 shrink-0 hidden lg:block">Product Catalog</h4>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            ref={searchInputRef}
            placeholder="Search products (F1)..." 
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={onOpenScanner}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-500"
            title="Scan Barcode"
          >
            <Scan size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-emerald-500 transition-all bg-white text-left text-sm group glow-card"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 font-bold mb-3 transition-colors">
                {product.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-slate-800 line-clamp-2 text-center h-10">{product.name}</span>
              <span className="text-emerald-600 font-black mt-2">${product.unitSellingPrice.toFixed(2)}</span>
              {product.type === 'product' && (
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Stock: {product.quantity}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
