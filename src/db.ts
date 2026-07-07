import Dexie, { Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  image?: string;
  barcode?: string;
  description: string;
  quantity: number;
  unitOrderPrice: number;
  unitSellingPrice: number;
  type: 'product' | 'service';
}

export interface SaleItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitOrderPrice: number; // to calculate profit later
}

export interface SaleLog {
  id?: number;
  timestamp: number;
  items: SaleItem[];
  subTotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  salespersonId: number;
  salespersonName: string;
  status: 'completed' | 'quotation' | 'reversed' | 'reversed_original';
  customerName?: string;
}

export interface Staff {
  id?: number;
  name: string;
  role: 'Admin' | 'Manager' | 'Salesperson';
  pin: string; // for simple auth mockup
}

export interface AuditLog {
  id?: number;
  userId: number;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

export class ComfortPOSDB extends Dexie {
  products!: Table<Product>;
  sales!: Table<SaleLog>;
  staff!: Table<Staff>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('ComfortPOSDB_v2');
    this.version(1).stores({
      products: '++id, name, type',
      sales: '++id, timestamp, salespersonId, status',
      staff: '++id, name, role',
      auditLogs: '++id, userId, action, timestamp'
    });
    this.version(2).stores({
      products: '++id, name, type, barcode'
    });
  }
}

export const db = new ComfortPOSDB();

// Initialize database (no mock data)
export async function initializeDatabase() {
  // We can leave this empty or put future migrations here.
}
