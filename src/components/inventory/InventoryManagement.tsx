import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  Barcode,
  History,
  CheckCircle2,
  Printer,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, GroceryCategory, ProductUnit, InventoryLog } from '../../types';

export const InventoryManagement: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    inventoryLogs,
    hasRole,
    currentUser,
    users,
    syncWithSupabase,
    supabaseConfig,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetProduct, setAdjustTargetProduct] = useState<Product | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('10');
  const [adjustReason, setAdjustReason] = useState<InventoryLog['reason']>('restock');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    barcode: '',
    plu: '',
    category: 'Produce & Fruits' as GroceryCategory,
    unit: 'pcs' as ProductUnit,
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockThreshold: '10',
    isWeighted: false,
    supplier: '',
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesLowStock = !onlyLowStock || p.stockQuantity <= p.minStockThreshold;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.plu && p.plu.includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));

      return matchesCategory && matchesLowStock && matchesQuery;
    });
  }, [products, categoryFilter, onlyLowStock, searchQuery]);

  const requestAdminOverride = (action: string) => {
    if (currentUser.role === 'admin_owner') return true;
    if (currentUser.role !== 'cashier' && currentUser.role !== 'manager') return true;

    const adminOwner = users.find((user) => user.role === 'admin_owner');
    const pinInput = window.prompt(`This action requires Admin/Owner approval to ${action}. Enter the Admin/Owner PIN:`);

    if (!adminOwner || !pinInput) return false;
    return pinInput.trim() === adminOwner.pin;
  };

  const handleOpenAdjust = (product: Product) => {
    if (!requestAdminOverride('adjust inventory')) {
      alert('Admin/Owner PIN verification failed. Adjustments require approval.');
      return;
    }

    setAdjustTargetProduct(product);
    setAdjustQtyInput('10');
    setAdjustReason('restock');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = (multiplier: 1 | -1) => {
    if (!adjustTargetProduct) return;
    const qty = parseFloat(adjustQtyInput);
    if (isNaN(qty) || qty <= 0) return;

    adjustStock(adjustTargetProduct.id, qty * multiplier, adjustReason);
    setIsAdjustModalOpen(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAdminOverride('create a product record')) {
      alert('Admin/Owner PIN verification failed. Product creation requires approval.');
      return;
    }

    if (!newProductForm.name || !newProductForm.barcode) {
      alert('Product name and barcode are required.');
      return;
    }

    addProduct({
      name: newProductForm.name,
      barcode: newProductForm.barcode,
      plu: newProductForm.plu || undefined,
      category: newProductForm.category,
      unit: newProductForm.unit,
      costPrice: parseFloat(newProductForm.costPrice) || 0,
      sellingPrice: parseFloat(newProductForm.sellingPrice) || 0,
      stockQuantity: parseFloat(newProductForm.stockQuantity) || 0,
      minStockThreshold: parseFloat(newProductForm.minStockThreshold) || 10,
      isWeighted: newProductForm.isWeighted,
      supplier: newProductForm.supplier || undefined,
    });

    setIsAddModalOpen(false);
    setNewProductForm({
      name: '',
      barcode: '',
      plu: '',
      category: 'Produce & Fruits',
      unit: 'pcs',
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '',
      minStockThreshold: '10',
      isWeighted: false,
      supplier: '',
    });
  };

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    const res = await syncWithSupabase();
    setIsSyncing(false);
    if (res.success) {
      alert(`Synchronized ${res.count} products to Supabase live database!`);
    } else {
      alert(res.error || 'Sync failed. Check Supabase connection settings.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <span>Grocery Inventory Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time stock tracking, barcode catalog, restock audits, and safety stock thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {supabaseConfig.isConnected && (
            <button
              onClick={handleSyncSupabase}
              disabled={isSyncing}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Push all products to Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Supabase'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAuditLogsOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Trail</span>
          </button>

          {hasRole(['admin_owner', 'manager', 'inventory']) && (
            <button
              id="btn-add-grocery-product"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, barcode, supplier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="All">All Grocery Departments</option>
            <option value="Produce & Fruits">Produce & Fruits</option>
            <option value="Dairy & Eggs">Dairy & Eggs</option>
            <option value="Bakery & Deli">Bakery & Deli</option>
            <option value="Meat & Poultry">Meat & Poultry</option>
            <option value="Beverages">Beverages</option>
            <option value="Pantry & Grains">Pantry & Grains</option>
            <option value="Snacks & Sweets">Snacks & Sweets</option>
            <option value="Household & Care">Household & Care</option>
          </select>

          <button
            onClick={() => setOnlyLowStock((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              onlyLowStock
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Critical Only</span>
          </button>
        </div>
      </div>

      {/* Inventory Master Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Item & Barcode</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-right">Retail Price</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.stockQuantity <= p.minStockThreshold;
                const isOut = p.stockQuantity <= 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 mt-0.5">
                        <span>Barcode: {p.barcode}</span>
                        {p.plu && (
                          <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-semibold">
                            PLU: {p.plu}
                          </span>
                        )}
                        {p.isWeighted && (
                          <span className="text-sky-700 bg-sky-50 px-1 rounded font-semibold">
                            Weighted
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full text-[11px]">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-medium">
                      ${p.costPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${p.sellingPrice.toFixed(2)} / {p.unit}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold">
                        {isOut ? (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Out of Stock (0)
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {p.stockQuantity} {p.unit} (Low)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            {p.stockQuantity} {p.unit}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Safety Min: {p.minStockThreshold} {p.unit}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {p.supplier || 'Local Produce / General'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Shelf Barcode Label View */}
                        <button
                          onClick={() => setBarcodeLabelProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View & Print Shelf Barcode Label"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>

                        {/* Adjust Stock Button */}
                        {hasRole(['admin_owner', 'manager', 'inventory']) && (
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && adjustTargetProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Adjust Inventory: {adjustTargetProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Stock: <strong>{adjustTargetProduct.stockQuantity} {adjustTargetProduct.unit}</strong>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity ({adjustTargetProduct.unit}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  value={adjustQtyInput}
                  onChange={(e) => setAdjustQtyInput(e.target.value)}
                  className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Reason:
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as InventoryLog['reason'])}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="restock">Store Restock (Received goods)</option>
                  <option value="supplier_delivery">Supplier Delivery (New PO)</option>
                  <option value="spoilage_waste">Produce Spoilage / Expired Waste</option>
                  <option value="inventory_audit">Inventory Count Audit Correction</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAdjust(-1)}
                className="flex-1 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                Deduct (-)
              </button>
              <button
                onClick={() => handleConfirmAdjust(1)}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
              >
                Add Stock (+)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SHELF LABEL PREVIEW MODAL */}
      {barcodeLabelProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 mb-2">Shelf Price & Barcode Label</h3>
            
            {/* Shelf Tag Visual */}
            <div className="p-4 bg-white border-2 border-dashed border-slate-400 rounded-xl font-mono text-center my-4 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">FreshMart Groceries</div>
              <div className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{barcodeLabelProduct.name}</div>
              <div className="text-2xl font-black text-slate-900 my-1">
                ${barcodeLabelProduct.sellingPrice.toFixed(2)}
                <span className="text-xs font-normal text-slate-500"> / {barcodeLabelProduct.unit}</span>
              </div>
              
              {/* Simulated barcode */}
              <div className="tracking-[0.2em] font-mono text-xs text-slate-800 my-2">
                ||| | ||||| |||| | ||||| ||| ||
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-600">{barcodeLabelProduct.barcode}</div>
              {barcodeLabelProduct.plu && (
                <div className="text-[10px] text-emerald-700 font-bold">PLU CODE: {barcodeLabelProduct.plu}</div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBarcodeLabelProduct(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL LOGS MODAL */}
      {isAuditLogsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[80vh] flex flex-col">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">Inventory Audit Trail Log</h3>
            <p className="text-xs text-slate-500 mb-3">Historical record of all manual and automatic stock updates</p>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {inventoryLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No stock logs recorded yet.</div>
              ) : (
                inventoryLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{log.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        Reason: <span className="capitalize font-semibold text-slate-700">{log.reason.replace('_', ' ')}</span> • By {log.recordedBy}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${log.changeQuantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.previousStock} → {log.newStock} units
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsAuditLogsOpen(false)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close Log
            </button>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-slate-900 mb-4">Add New Grocery Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  placeholder="e.g. Organic Gala Apples"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode (UPC/EAN) *</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.barcode}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    placeholder="e.g. 011110416001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PLU Code (Optional)</label>
                  <input
                    type="text"
                    value={newProductForm.plu}
                    onChange={(e) => setNewProductForm({ ...newProductForm, plu: e.target.value })}
                    placeholder="e.g. 4011"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as GroceryCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Produce & Fruits">Produce & Fruits</option>
                    <option value="Dairy & Eggs">Dairy & Eggs</option>
                    <option value="Bakery & Deli">Bakery & Deli</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Pantry & Grains">Pantry & Grains</option>
                    <option value="Snacks & Sweets">Snacks & Sweets</option>
                    <option value="Household & Care">Household & Care</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={newProductForm.unit}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value as ProductUnit })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="pack">Pack</option>
                    <option value="bottle">Bottle</option>
                    <option value="box">Box</option>
                    <option value="bag">Bag</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.costPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, costPrice: e.target.value })}
                    placeholder="2.50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Retail Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.sellingPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sellingPrice: e.target.value })}
                    placeholder="4.99"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Stock Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProductForm.stockQuantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stockQuantity: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Safety Reorder Min</label>
                  <input
                    type="number"
                    step="1"
                    value={newProductForm.minStockThreshold}
                    onChange={(e) => setNewProductForm({ ...newProductForm, minStockThreshold: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier / Distributor</label>
                <input
                  type="text"
                  value={newProductForm.supplier}
                  onChange={(e) => setNewProductForm({ ...newProductForm, supplier: e.target.value })}
                  placeholder="e.g. Valley Fresh Farms"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductForm.isWeighted}
                    onChange={(e) => setNewProductForm({ ...newProductForm, isWeighted: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">Sold by Weight (Prompt Cashier for Scale Input)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
