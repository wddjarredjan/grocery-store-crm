import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Sale } from '../types';

let supabaseClient: SupabaseClient | null = null;
const STORAGE_KEY_SUPABASE = 'freshmart_supabase_config';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export function loadStoredSupabaseConfig(): SupabaseConfigState {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const envUrl = metaEnv?.VITE_SUPABASE_URL || '';
  const envKey = metaEnv?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        isConnected: !!parsed.isConnected,
      };
    }
  } catch (e) {
    console.error('Failed to load stored Supabase configuration', e);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: !!(envUrl && envKey),
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string, isConnected = false) {
  try {
    localStorage.setItem(
      STORAGE_KEY_SUPABASE,
      JSON.stringify({ url, anonKey, isConnected, updatedAt: new Date().toISOString() })
    );
    // Reset client to reinitialize on next call
    supabaseClient = null;
  } catch (e) {
    console.error('Failed to save Supabase config to local storage', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const config = loadStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseClient;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableFound?: boolean }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey);
    const { data, error } = await testClient.from('products').select('id').limit(1);

    if (error) {
      // Check if table doesn't exist yet (which means credentials are valid, but migration is needed)
      if (error.code === '42P01' || error.message.includes('relation "products" does not exist')) {
        return {
          success: true,
          tableFound: false,
          message: 'Connected to Supabase! However, the "products" table was not found. Please run the SQL schema script below.',
        };
      }
      return { success: false, message: error.message };
    }

    return {
      success: true,
      tableFound: true,
      message: `Connection successful! Found ${data ? data.length : 0} existing records in "products" table.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg || 'Connection failed. Check network or CORS settings.' };
  }
}

export async function syncLocalProductsToSupabase(products: Product[]): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase client is not configured.' };
  }

  try {
    const payload = products.map((p) => ({
      id: p.id,
      barcode: p.barcode,
      plu: p.plu || null,
      name: p.name,
      category: p.category,
      unit: p.unit,
      cost_price: p.costPrice,
      selling_price: p.sellingPrice,
      stock_quantity: p.stockQuantity,
      min_stock_threshold: p.minStockThreshold,
      is_weighted: p.isWeighted || false,
      supplier: p.supplier || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('products').upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, count: payload.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: errorMsg };
  }
}

export async function recordSaleInSupabase(sale: Sale): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No active Supabase client' };

  try {
    // 1. Insert into sales table
    const { error: saleError } = await client.from('sales').insert({
      id: sale.id,
      invoice_number: sale.invoiceNumber,
      cashier_id: sale.cashierId,
      cashier_name: sale.cashierName,
      subtotal: sale.subtotal,
      tax_amount: sale.taxAmount,
      discount_amount: sale.discountAmount,
      total_amount: sale.totalAmount,
      payment_method: sale.paymentMethod,
      amount_tendered: sale.amountTendered,
      change_amount: sale.changeAmount,
      customer_name: sale.customerName || null,
      created_at: sale.createdAt,
      status: sale.status,
    });

    if (saleError) throw saleError;

    // 2. Insert items
    const saleItems = sale.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      barcode: item.barcode,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      total_price: item.totalPrice,
    }));

    const { error: itemsError } = await client.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

// Users (app_users) helpers
export async function fetchSupabaseUsers(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const { data, error } = await client.from('app_users').select('*');
    if (error) throw error;
    return { success: true, users: data ?? [] };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function upsertSupabaseUser(user: any): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin,
      is_active: user.isActive ?? true,
      created_at: user.createdAt || new Date().toISOString(),
    };
    const { error } = await client.from('app_users').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function deleteSupabaseUser(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const { error } = await client.from('app_users').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

// Auth helpers
export async function authSignUp(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const res = await client.auth.signUp({ email, password });
    if (res.error) throw res.error;
    return { success: true, data: res.data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function authSignIn(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const res = await client.auth.signInWithPassword({ email, password });
    if (res.error) throw res.error;
    return { success: true, data: res.data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function authSignOut(): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export function onAuthStateChange(handler: (event: string, session: any) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((event, session) => {
    try {
      handler(event, session);
    } catch (e) {
      console.warn('Auth state handler error', e);
    }
  });
  return () => {
    // unsubscribe
    try {
      data.subscription.unsubscribe();
    } catch (e) {
      // ignore
    }
  };
}

export async function fetchSupabaseUserByEmail(email: string): Promise<{ success: boolean; user?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const { data, error } = await client.from('app_users').select('*').eq('email', email).limit(1).maybeSingle();
    if (error) throw error;
    return { success: true, user: data };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function recordSystemHistory(entry: {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  details?: any;
  created_at?: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  try {
    const payload = {
      id: entry.id,
      actor_id: entry.actor_id || null,
      actor_name: entry.actor_name || null,
      action: entry.action,
      entity: entry.entity || null,
      entity_id: entry.entity_id || null,
      details: entry.details ? (typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)) : null,
      created_at: entry.created_at || new Date().toISOString(),
    };
    const { error } = await client.from('system_history').insert([payload]);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export function generateSupabaseSqlMigration(): string {
  return `-- ============================================================
-- FreshMart Grocery POS & ERP - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products / Inventory Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    barcode VARCHAR(64) NOT NULL UNIQUE,
    plu VARCHAR(16),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(32) NOT NULL DEFAULT 'pcs',
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    is_weighted BOOLEAN DEFAULT false,
    supplier VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant barcode scan lookups in high-speed checkout
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_plu ON public.products(plu);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 3. Sales / Receipts Table
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    cashier_id TEXT NOT NULL,
    cashier_name VARCHAR(120) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
    amount_tendered NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    customer_name VARCHAR(120),
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);

-- 4. Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    barcode VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

-- 5. Inventory Stock Audit Logs Table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    change_quantity NUMERIC(10, 2) NOT NULL,
    previous_stock NUMERIC(10, 2) NOT NULL,
    new_stock NUMERIC(10, 2) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    recorded_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Employees & Roles (RBAC)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'cashier', -- 'cashier', 'inventory_clerk', 'manager'
    pin VARCHAR(8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. System History Log
CREATE TABLE IF NOT EXISTS public.system_history (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name VARCHAR(150),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Realtime Publications for instant multi-register sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users or public anon key
CREATE POLICY "Public full access to products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public full access to sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Public full access to sale_items" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Public full access to inventory_logs" ON public.inventory_logs FOR ALL USING (true);
CREATE POLICY "Public full access to app_users" ON public.app_users FOR ALL USING (true);
`;
}
