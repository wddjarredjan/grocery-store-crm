import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  UserRole,
  Product,
  CartItem,
  Sale,
  InventoryLog,
  LowStockAlert,
  HeldOrder,
  CashDrawerShift,
  PaymentMethod,
  SupabaseConfig,
} from '../types';
import { INITIAL_USERS, INITIAL_PRODUCTS, generateSeedSales, INITIAL_SHIFT } from '../data/seedData';
import { playScannerBeep, playSuccessChime, playErrorAlert } from '../services/audio';
import {
  loadStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getSupabaseClient,
  syncLocalProductsToSupabase,
  recordSaleInSupabase,
  testSupabaseConnection,
  fetchSupabaseUsers,
  upsertSupabaseUser,
  deleteSupabaseUser,
  authSignIn,
  authSignUp,
  authSignOut,
  onAuthStateChange,
  fetchSupabaseUserByEmail,
} from '../services/supabase';

interface AppContextType {
  // Authentication & RBAC
  currentUser: User;
  users: User[];
  switchUserByPin: (pin: string) => boolean;
  switchUserDirect: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;

  // Inventory
  products: Product[];
  inventoryLogs: InventoryLog[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, reason: InventoryLog['reason']) => void;

  // Alerts & Notifications
  alerts: LowStockAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  // POS Cart & Register
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, discountPercent?: number) => void;
  updateCartItemQty: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    itemCount: number;
  };

  // Hold / Recall Order
  heldOrders: HeldOrder[];
  holdOrder: (note?: string) => void;
  recallOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;

  // Checkout & Sales
  sales: Sale[];
  lastSale: Sale | null;
  completeSale: (
    paymentMethod: PaymentMethod,
    amountTendered: number,
    customerName?: string
  ) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
  activeShift: CashDrawerShift;

  // Supabase Sync
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  syncWithSupabase: () => Promise<{ success: boolean; count?: number; error?: string }>;
  // Auth
  authSignIn?: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  authSignUp?: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  authSignOut?: () => Promise<{ success: boolean; error?: string }>;

  // Navigation
  activeTab: 'pos' | 'inventory' | 'analytics' | 'reports' | 'users' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'analytics' | 'reports' | 'users' | 'settings') => void;

  // Audio helpers
  beep: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'freshmart_products_v1',
  SALES: 'freshmart_sales_v1',
  USERS: 'freshmart_users_v1',
  LOGS: 'freshmart_inv_logs_v1',
  ALERTS: 'freshmart_alerts_v1',
  HELD: 'freshmart_held_orders_v1',
  CURRENT_USER: 'freshmart_current_user_v1',
  ACTIVE_SHIFT: 'freshmart_active_shift_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default to owner for full administrative access during demo
    return INITIAL_USERS.find((user) => user.role === 'admin_owner') ?? INITIAL_USERS[0];
  });

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Sales state
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : generateSeedSales();
    } catch {
      return generateSeedSales();
    }
  });

  // Inventory logs
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Low stock alerts
  const [alerts, setAlerts] = useState<LowStockAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Pre-populate with initial low stock items
    return INITIAL_PRODUCTS.filter((p) => p.stockQuantity <= p.minStockThreshold).map((p) => ({
      id: `alert_${p.id}_${Date.now()}`,
      productId: p.id,
      productName: p.name,
      category: p.category,
      currentStock: p.stockQuantity,
      minThreshold: p.minStockThreshold,
      unit: p.unit,
      timestamp: new Date().toISOString(),
      isRead: false,
    }));
  });

  // Active register cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HELD);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Active shift
  const [activeShift, setActiveShift] = useState<CashDrawerShift>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
      return saved ? JSON.parse(saved) : INITIAL_SHIFT;
    } catch {
      return INITIAL_SHIFT;
    }
  });

  // Supabase Config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const loaded = loadStoredSupabaseConfig();
    return {
      url: loaded.url,
      anonKey: loaded.anonKey,
      isConnected: loaded.isConnected,
    };
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'analytics' | 'reports' | 'users' | 'settings'>('pos');

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error(e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(inventoryLogs));
    } catch (e) {
      console.error(e);
    }
  }, [inventoryLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error(e);
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HELD, JSON.stringify(heldOrders));
    } catch (e) {
      console.error(e);
    }
  }, [heldOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(activeShift));
    } catch (e) {
      console.error(e);
    }
  }, [activeShift]);

  // Real-time Supabase subscription setup
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !supabaseConfig.isConnected) return;

    try {
      const channel = client
        .channel('realtime_products')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedPrd = payload.new;
              setProducts((prev) =>
                prev.map((item) =>
                  item.id === updatedPrd.id
                    ? {
                        ...item,
                        stockQuantity: Number(updatedPrd.stock_quantity),
                        sellingPrice: Number(updatedPrd.selling_price),
                        costPrice: Number(updatedPrd.cost_price),
                        updatedAt: updatedPrd.updated_at,
                      }
                    : item
                )
              );
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }, [supabaseConfig.isConnected]);

  // Sync users with Supabase when connected and subscribe to realtime changes
  useEffect(() => {
    const client = getSupabaseClient();
    let channel: any = null;
    let mounted = true;
    if (!client || !supabaseConfig.isConnected) return;

    (async () => {
      try {
        const { data, error } = await client.from('app_users').select('*');
        if (!mounted) return;
        if (!error && data) {
          // Map database fields to local User shape and preserve any existing local PINs
          const mapped = data.map((u: any) => {
            const existing = users.find((p) => p.id === u.id);
            const pin = u.pin || (existing ? existing.pin : '');
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              pin,
              isActive: u.is_active ?? true,
              createdAt: u.created_at,
            };
          });
          setUsers(mapped);
        }

        channel = client
          .channel('realtime_app_users')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'app_users' },
            (payload) => {
              const row = payload.new ?? payload.old;
              if (!row) return;
              const existing = users.find((p) => p.id === row.id);
              const mappedUser = {
                id: row.id,
                name: row.name,
                email: row.email,
                role: row.role,
                pin: row.pin || (existing ? existing.pin : ''),
                isActive: row.is_active ?? true,
                createdAt: row.created_at,
              };

              setUsers((prev) => {
                if (payload.eventType === 'DELETE') {
                  return prev.filter((u) => u.id !== row.id);
                }
                const exists = prev.some((u) => u.id === row.id);
                if (exists) {
                  return prev.map((u) => (u.id === row.id ? { ...u, ...mappedUser } : u));
                }
                return [mappedUser, ...prev];
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Could not sync users from Supabase:', err);
      }
    })();

    return () => {
      mounted = false;
      if (client && channel) client.removeChannel(channel);
    };
  }, [supabaseConfig.isConnected]);

  // Supabase Auth — listen for auth state and map Auth users to app_users
  useEffect(() => {
    if (!supabaseConfig.isConnected) return;
    let unsub: (() => void) | null = null;

    const handleAuth = async (event: string, session: any) => {
      try {
        if (session && session.user) {
          const authUser = session.user;
          const email = authUser.email;
          if (!email) return;
          // Try to find matching app_user by email
          const remote = await fetchSupabaseUserByEmail(email);
          if (remote.success && remote.user) {
            const row = remote.user;
            const existing = users.find((p) => p.id === row.id);
            const mapped = {
              id: row.id,
              name: row.name || email,
              email: row.email,
              role: row.role || 'cashier',
              pin: row.pin || (existing ? existing.pin : ''),
              isActive: row.is_active ?? true,
              createdAt: row.created_at,
            } as User;
            setCurrentUser(mapped);
            // ensure local users list contains it
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === mapped.id);
              if (exists) return prev.map((u) => (u.id === mapped.id ? mapped : u));
              return [mapped, ...prev];
            });
          } else {
            // create a new app_user tied to the auth user's id
            const newUser: User = {
              id: authUser.id,
              name: authUser.user_metadata?.full_name || email,
              email,
              role: 'cashier',
              pin: '',
              isActive: true,
            };
            setUsers((prev) => [newUser, ...prev]);
            setCurrentUser(newUser);
            // persist to Supabase app_users table
            upsertSupabaseUser(newUser).catch((e) => console.warn('Could not upsert app_user for auth user', e));
          }
        } else {
          // signed out; do not forcibly clear currentUser to avoid logging out other local sessions
        }
      } catch (err) {
        console.warn('Auth handling error', err);
      }
    };

    unsub = onAuthStateChange(handleAuth);

    // Check initial session
    (async () => {
      const client = getSupabaseClient();
      if (!client) return;
      try {
        const { data } = await client.auth.getSession();
        if (data?.session) {
          await handleAuth('INIT', data.session);
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [supabaseConfig.isConnected, users]);

  const normalizeUserRole = useCallback((role: UserRole): UserRole => {
    return role === 'inventory_clerk' ? 'inventory' : role;
  }, []);

  // Role Checker
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      const roleList = (Array.isArray(roles) ? roles : [roles]).map(normalizeUserRole);
      return roleList.includes(normalizeUserRole(currentUser.role));
    },
    [currentUser.role, normalizeUserRole]
  );

  // Switch User by PIN
  const switchUserByPin = useCallback(
    (pin: string): boolean => {
      // Allow concurrent logins across devices: match PIN regardless of `isActive` flag.
      // `isActive` is treated as account enabled/disabled by admins, not session state.
      const trimmed = pin.trim();
      const matchedUser = users.find((u) => u.pin === trimmed);
      if (matchedUser) {
        setCurrentUser(matchedUser);
        playSuccessChime();
        return true;
      }
      playErrorAlert();
      return false;
    },
    [users]
  );

  const switchUserDirect = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const addUser = useCallback((newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: `usr_${Date.now()}`,
    };
    setUsers((prev) => [...prev, user]);
    if (supabaseConfig.isConnected) {
      upsertSupabaseUser(user).catch((err) => console.warn('Could not upsert user to Supabase:', err));
    }
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setCurrentUser((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
    if (supabaseConfig.isConnected) {
      const existing = users.find((u) => u.id === id) ?? { id };
      const merged = { ...existing, ...updates };
      upsertSupabaseUser(merged).catch((err) => console.warn('Could not update user on Supabase:', err));
    }
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => {
      const remaining = prev.filter((user) => user.id !== id);
      if (currentUser.id === id) {
        setCurrentUser(remaining[0] ?? INITIAL_USERS[0]);
      }
      return remaining;
    });
    if (supabaseConfig.isConnected) {
      deleteSupabaseUser(id).catch((err) => console.warn('Could not delete user from Supabase:', err));
    }
  }, [currentUser.id]);

  // Web Notification Trigger
  const triggerNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/public/favicon.ico',
        });
      } catch (e) {
        console.debug('Push notification not allowed in iframe:', e);
      }
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Inventory Management
  const addProduct = useCallback(
    (newPrd: Omit<Product, 'id' | 'updatedAt'>) => {
      const product: Product = {
        ...newPrd,
        id: `prd_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [product, ...prev]);

      // Add audit log
      const log: InventoryLog = {
        id: `log_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        changeQuantity: product.stockQuantity,
        previousStock: 0,
        newStock: product.stockQuantity,
        reason: 'restock',
        recordedBy: currentUser.name,
        timestamp: new Date().toISOString(),
      };
      setInventoryLogs((prev) => [log, ...prev]);
    },
    [currentUser.name]
  );

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const adjustStock = useCallback(
    (productId: string, quantityChange: number, reason: InventoryLog['reason']) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const oldStock = p.stockQuantity;
          const newStock = Math.max(0, Number((oldStock + quantityChange).toFixed(2)));

          // Record Log
          const log: InventoryLog = {
            id: `log_${Date.now()}_${Math.random()}`,
            productId: p.id,
            productName: p.name,
            changeQuantity: quantityChange,
            previousStock: oldStock,
            newStock,
            reason,
            recordedBy: currentUser.name,
            timestamp: new Date().toISOString(),
          };
          setInventoryLogs((l) => [log, ...l]);

          // Check if low stock threshold crossed
          if (newStock <= p.minStockThreshold) {
            const alertId = `alert_${p.id}_${Date.now()}`;
            setAlerts((a) => [
              {
                id: alertId,
                productId: p.id,
                productName: p.name,
                category: p.category,
                currentStock: newStock,
                minThreshold: p.minStockThreshold,
                unit: p.unit,
                timestamp: new Date().toISOString(),
                isRead: false,
              },
              ...a.filter((item) => item.productId !== p.id),
            ]);

            triggerNotification(
              `⚠️ Low Stock Alert: ${p.name}`,
              `Current inventory is down to ${newStock} ${p.unit}. Reorder threshold is ${p.minStockThreshold} ${p.unit}.`
            );
          }

          return { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() };
        })
      );
    },
    [currentUser.name, triggerNotification]
  );

  // Cart operations
  const addToCart = useCallback((product: Product, quantity = 1, discountPercent = 0) => {
    playScannerBeep();
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Number((existing.quantity + quantity).toFixed(2));
        const effectivePrice = product.sellingPrice * (1 - existing.discountPercent / 100);
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                totalPrice: Number((newQty * effectivePrice).toFixed(2)),
              }
            : item
        );
      }

      const effectivePrice = product.sellingPrice * (1 - discountPercent / 100);
      const newItem: CartItem = {
        product,
        quantity: Number(quantity.toFixed(2)),
        unitPrice: product.sellingPrice,
        discountPercent,
        totalPrice: Number((quantity * effectivePrice).toFixed(2)),
      };
      return [...prev, newItem];
    });
  }, []);

  const updateCartItemQty = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const effectivePrice = item.unitPrice * (1 - item.discountPercent / 100);
        return {
          ...item,
          quantity: Number(quantity.toFixed(2)),
          totalPrice: Number((quantity * effectivePrice).toFixed(2)),
        };
      })
    );
  }, []);

  const updateCartItemDiscount = useCallback((productId: string, discount: number) => {
    const validDiscount = Math.max(0, Math.min(100, discount));
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const effectivePrice = item.unitPrice * (1 - validDiscount / 100);
        return {
          ...item,
          discountPercent: validDiscount,
          totalPrice: Number((item.quantity * effectivePrice).toFixed(2)),
        };
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Cart Calculations
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let itemCount = 0;

    cart.forEach((item) => {
      const gross = item.unitPrice * item.quantity;
      const net = item.totalPrice;
      subtotal += net;
      discount += gross - net;
      itemCount += item.product.isWeighted ? 1 : item.quantity;
    });

    // 7% Grocery Standard Sales Tax (Packaged / Non-fresh produce)
    const tax = Number((subtotal * 0.07).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      discount: Number(discount.toFixed(2)),
      total,
      itemCount,
    };
  }, [cart]);

  // Hold / Recall Order
  const holdOrder = useCallback(
    (note?: string) => {
      if (cart.length === 0) return;
      const order: HeldOrder = {
        id: `held_${Date.now()}`,
        cart: [...cart],
        customerNote: note || `Order #${heldOrders.length + 1} (${cart.length} items)`,
        createdAt: new Date().toISOString(),
      };
      setHeldOrders((prev) => [order, ...prev]);
      setCart([]);
      playScannerBeep();
    },
    [cart, heldOrders.length]
  );

  const recallOrder = useCallback(
    (id: string) => {
      const found = heldOrders.find((o) => o.id === id);
      if (!found) return;
      setCart(found.cart);
      setHeldOrders((prev) => prev.filter((o) => o.id !== id));
      playScannerBeep();
    },
    [heldOrders]
  );

  const deleteHeldOrder = useCallback((id: string) => {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  // Complete Sale
  const completeSale = useCallback(
    async (
      paymentMethod: PaymentMethod,
      amountTendered: number,
      customerName?: string
    ): Promise<{ success: boolean; sale?: Sale; error?: string }> => {
      if (cart.length === 0) {
        return { success: false, error: 'Cannot complete checkout with empty cart.' };
      }

      if (paymentMethod === 'cash' && amountTendered < cartTotals.total) {
        return { success: false, error: 'Cash tendered is less than total amount due.' };
      }

      const changeAmount =
        paymentMethod === 'cash' ? Number((amountTendered - cartTotals.total).toFixed(2)) : 0;

      const saleId = `sale_${Date.now()}`;
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sales.length + 1).padStart(4, '0')}`;

      const saleItems = cart.map((item) => ({
        productId: item.product.id,
        barcode: item.product.barcode,
        name: item.product.name,
        category: item.product.category,
        unit: item.product.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice,
        discountPercent: item.discountPercent,
        totalPrice: item.totalPrice,
      }));

      const newSale: Sale = {
        id: saleId,
        invoiceNumber,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        items: saleItems,
        subtotal: cartTotals.subtotal,
        taxAmount: cartTotals.tax,
        discountAmount: cartTotals.discount,
        totalAmount: cartTotals.total,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? amountTendered : cartTotals.total,
        changeAmount,
        customerName,
        createdAt: now.toISOString(),
        status: 'completed',
      };

      // 1. Deduct stock for all items
      setProducts((prev) =>
        prev.map((prd) => {
          const cartItem = cart.find((c) => c.product.id === prd.id);
          if (!cartItem) return prd;

          const updatedStock = Math.max(0, Number((prd.stockQuantity - cartItem.quantity).toFixed(2)));

          // Check if low stock threshold crossed
          if (updatedStock <= prd.minStockThreshold) {
            triggerNotification(
              `⚠️ Low Stock Alert: ${prd.name}`,
              `Stock dropped to ${updatedStock} ${prd.unit} after checkout. Threshold: ${prd.minStockThreshold} ${prd.unit}.`
            );

            setAlerts((a) => [
              {
                id: `alert_${prd.id}_${Date.now()}`,
                productId: prd.id,
                productName: prd.name,
                category: prd.category,
                currentStock: updatedStock,
                minThreshold: prd.minStockThreshold,
                unit: prd.unit,
                timestamp: new Date().toISOString(),
                isRead: false,
              },
              ...a.filter((item) => item.productId !== prd.id),
            ]);
          }

          return {
            ...prd,
            stockQuantity: updatedStock,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      // 2. Add inventory logs
      const logs: InventoryLog[] = cart.map((c) => ({
        id: `log_${Date.now()}_${c.product.id}`,
        productId: c.product.id,
        productName: c.product.name,
        changeQuantity: -c.quantity,
        previousStock: c.product.stockQuantity,
        newStock: Math.max(0, Number((c.product.stockQuantity - c.quantity).toFixed(2))),
        reason: 'sale',
        recordedBy: currentUser.name,
        timestamp: now.toISOString(),
      }));
      setInventoryLogs((prev) => [...logs, ...prev]);

      // 3. Update active shift drawer totals
      setActiveShift((prev) => {
        const isCash = paymentMethod === 'cash';
        const newCashSales = isCash ? prev.cashSales + cartTotals.total : prev.cashSales;
        const newNonCash = !isCash ? prev.nonCashSales + cartTotals.total : prev.nonCashSales;
        return {
          ...prev,
          cashSales: Number(newCashSales.toFixed(2)),
          nonCashSales: Number(newNonCash.toFixed(2)),
          expectedDrawerCash: Number((prev.startingCashFloat + newCashSales).toFixed(2)),
        };
      });

      // 4. Save sale locally
      setSales((prev) => [newSale, ...prev]);
      setLastSale(newSale);
      setCart([]);
      playSuccessChime();

      // 5. Attempt background sync to Supabase if connected
      if (supabaseConfig.isConnected) {
        recordSaleInSupabase(newSale).catch((err) => {
          console.warn('Could not mirror sale to Supabase in background:', err);
        });
      }

      return { success: true, sale: newSale };
    },
    [cart, cartTotals, currentUser, sales.length, supabaseConfig.isConnected, triggerNotification]
  );

  // Alert dismissals
  const markAlertAsRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  }, []);

  const unreadAlertsCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts]);

  // Supabase Configuration
  const updateSupabaseConfig = useCallback(
    async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
      const testResult = await testSupabaseConnection(url, anonKey);
      if (testResult.success) {
        saveStoredSupabaseConfig(url, anonKey, true);
        setSupabaseConfig({
          url,
          anonKey,
          isConnected: true,
          lastSyncedAt: new Date().toISOString(),
        });
        return { success: true, message: testResult.message };
      } else {
        saveStoredSupabaseConfig(url, anonKey, false);
        setSupabaseConfig((prev) => ({ ...prev, isConnected: false }));
        return { success: false, message: testResult.message };
      }
    },
    []
  );

  const syncWithSupabase = useCallback(async () => {
    const result = await syncLocalProductsToSupabase(products);
    if (result.success) {
      setSupabaseConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
      }));
      return { success: true, count: result.count };
    }
    return { success: false, error: result.error };
  }, [products]);

  const value = {
    currentUser,
    users,
    switchUserByPin,
    switchUserDirect,
    addUser,
    updateUser,
    deleteUser,
    hasRole,

    products,
    inventoryLogs,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,

    alerts,
    unreadAlertsCount,
    markAlertAsRead,
    clearAllAlerts,
    requestNotificationPermission,

    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartTotals,

    heldOrders,
    holdOrder,
    recallOrder,
    deleteHeldOrder,

    sales,
    lastSale,
    completeSale,
    activeShift,

    supabaseConfig,
    updateSupabaseConfig,
    syncWithSupabase,
    authSignIn: async (email: string, password: string) => {
      const res = await authSignIn(email, password);
      if (!res.success) return { success: false, error: res.error };
      return { success: true };
    },
    authSignUp: async (email: string, password: string) => {
      const res = await authSignUp(email, password);
      if (!res.success) return { success: false, error: res.error };
      return { success: true };
    },
    authSignOut: async () => {
      const res = await authSignOut();
      if (!res.success) return { success: false, error: res.error };
      return { success: true };
    },

    activeTab,
    setActiveTab,

    beep: playScannerBeep,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
