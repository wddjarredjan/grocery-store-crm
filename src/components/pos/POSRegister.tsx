import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Barcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  Scale,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, GroceryCategory, PaymentMethod } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

const CATEGORIES: ('All' | GroceryCategory)[] = [
  'All',
  'Produce & Fruits',
  'Dairy & Eggs',
  'Bakery & Deli',
  'Meat & Poultry',
  'Beverages',
  'Pantry & Grains',
  'Snacks & Sweets',
  'Household & Care',
];

export const POSRegister: React.FC = () => {
  const {
    products,
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
    completeSale,
    lastSale,
    beep,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | GroceryCategory>('All');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Weighted produce modal
  const [weightedProduct, setWeightedProduct] = useState<Product | null>(null);
  const [produceWeight, setProduceWeight] = useState<string>('1.00');

  // Checkout Tender Modal
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [heldOrdersModalOpen, setHeldOrdersModalOpen] = useState(false);

  // Discount adjustment state for cart
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState<number>(0);

  // Hardware scanner wedge listener (scanners act as high-speed keyboard input)
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on a text input, don't hijack keyboard
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Barcode scanners type very rapidly (< 50ms per key)
      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          handleBarcodeScanned(barcodeBufferRef.current);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        if (timeDiff > 200) {
          // Reset buffer if typing was slow (user manual typing)
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned barcode lookup
  const handleBarcodeScanned = (code: string) => {
    const trimmed = code.trim();
    const matched = products.find(
      (p) => p.barcode === trimmed || p.plu === trimmed || p.id === trimmed
    );

    if (matched) {
      if (matched.isWeighted) {
        setWeightedProduct(matched);
        setProduceWeight('1.00');
      } else {
        addToCart(matched, 1);
      }
    } else {
      // Alert user if unknown barcode
      alert(`Barcode "${trimmed}" not recognized in grocery catalog.`);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.plu && p.plu.includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle clicking a product in the grid
  const handleProductClick = (product: Product) => {
    if (product.isWeighted) {
      setWeightedProduct(product);
      setProduceWeight('1.00');
    } else {
      addToCart(product, 1);
    }
  };

  const handleConfirmWeight = () => {
    if (!weightedProduct) return;
    const weightNum = parseFloat(produceWeight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    addToCart(weightedProduct, weightNum);
    setWeightedProduct(null);
  };

  const handleOpenTender = (method: PaymentMethod = 'cash') => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod(method);
    setCashTendered(cartTotals.total.toFixed(2));
    setIsTenderModalOpen(true);
  };

  const handleExecuteCheckout = async () => {
    const tenderedNumber =
      selectedPaymentMethod === 'cash' ? parseFloat(cashTendered) || 0 : cartTotals.total;

    const result = await completeSale(selectedPaymentMethod, tenderedNumber, customerName || undefined);
    if (result.success) {
      setIsTenderModalOpen(false);
      setCustomerName('');
      setIsReceiptOpen(true);
    } else {
      alert(result.error || 'Failed to complete checkout.');
    }
  };

  const changeDue = useMemo(() => {
    if (selectedPaymentMethod !== 'cash') return 0;
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, Number((tendered - cartTotals.total).toFixed(2)));
  }, [cashTendered, cartTotals.total, selectedPaymentMethod]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: Products Grid & Quick Search (7 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Search Bar & Barcode Scanner Trigger */}
          <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search grocery item name, barcode, or PLU code (e.g. 4011, Milk)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Camera Scanner Button */}
            <button
              id="btn-open-camera-scanner"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
              title="Open Barcode Scanner Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
          </div>

          {/* Department Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grocery Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const isLowStock = product.stockQuantity <= product.minStockThreshold;
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={isOutOfStock}
                  className={`group text-left p-3 rounded-2xl bg-white border transition-all relative flex flex-col justify-between hover:shadow-md hover:border-emerald-500 ${
                    isOutOfStock
                      ? 'opacity-40 cursor-not-allowed border-slate-200'
                      : isLowStock
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top tags */}
                  <div className="flex items-start justify-between gap-1 w-full mb-2">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {product.plu ? `PLU ${product.plu}` : product.barcode.slice(-5)}
                    </span>
                    {product.isWeighted ? (
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Scale className="w-2.5 h-2.5" />
                        Scale
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        Low Stock
                      </span>
                    ) : null}
                  </div>

                  {/* Product name & category */}
                  <div className="mb-3">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {product.category}
                    </div>
                  </div>

                  {/* Price & Stock info */}
                  <div className="flex items-end justify-between w-full pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">
                        ${product.sellingPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        per {product.unit}
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">
                      {product.stockQuantity} in stock
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No grocery items found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search query or barcode.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: High-Speed Register Cart Panel (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col sticky top-20 max-h-[calc(100vh-100px)]">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Current Basket</h3>
                <span className="text-[11px] text-slate-500">
                  {cartTotals.itemCount} items in transaction
                </span>
              </div>
            </div>

            {/* Quick Cart Actions */}
            <div className="flex items-center gap-1">
              {heldOrders.length > 0 && (
                <button
                  onClick={() => setHeldOrdersModalOpen(true)}
                  className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Recall parked/held orders"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recall ({heldOrders.length})</span>
                </button>
              )}
              {cart.length > 0 && (
                <button
                  onClick={() => holdOrder()}
                  className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Hold / Park Current Cart"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
              )}
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear Basket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 min-h-[180px] max-h-[340px]">
            {cart.map((item) => (
              <div key={item.product.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>
                        ${item.unitPrice.toFixed(2)} / {item.product.unit}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="text-emerald-700 bg-emerald-50 px-1 rounded text-[10px] font-semibold">
                          -{item.discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-xs text-slate-900">
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Qty Counter & Line Discount Trigger */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() =>
                        updateCartItemQty(
                          item.product.id,
                          item.product.isWeighted ? item.quantity - 0.25 : item.quantity - 1
                        )
                      }
                      className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold font-mono px-2 min-w-[2.5rem] text-center">
                      {item.quantity} {item.product.unit}
                    </span>
                    <button
                      onClick={() =>
                        updateCartItemQty(
                          item.product.id,
                          item.product.isWeighted ? item.quantity + 0.25 : item.quantity + 1
                        )
                      }
                      className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Discount Pill */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingDiscountId(
                          editingDiscountId === item.product.id ? null : item.product.id
                        );
                        setDiscountPercentInput(item.discountPercent);
                      }}
                      className="p-1 text-[11px] text-slate-500 hover:text-emerald-700 rounded flex items-center gap-0.5 transition-colors"
                      title="Apply item discount"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{item.discountPercent > 0 ? `${item.discountPercent}% off` : 'Discount'}</span>
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Discount Input Drawer */}
                {editingDiscountId === item.product.id && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">Discount %:</span>
                    <div className="flex gap-1">
                      {[5, 10, 20].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => {
                            updateCartItemDiscount(item.product.id, pct);
                            setEditingDiscountId(null);
                          }}
                          className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 hover:border-emerald-500 rounded font-semibold"
                        >
                          {pct}%
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          updateCartItemDiscount(item.product.id, 0);
                          setEditingDiscountId(null);
                        }}
                        className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:text-red-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 text-slate-300 stroke-1" />
                <p className="text-xs font-medium text-slate-600">Basket is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scan barcode or select an item from catalog
                </p>
              </div>
            )}
          </div>

          {/* Cart Totals Summary */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">${cartTotals.subtotal.toFixed(2)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Total Savings:</span>
                <span className="font-bold">-${cartTotals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>Sales Tax (7%):</span>
              <span className="font-semibold">${cartTotals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-extrabold text-slate-900">Total Amount:</span>
              <span className="text-xl font-black text-emerald-700">
                ${cartTotals.total.toFixed(2)}
              </span>
            </div>

            {/* Quick Checkout Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                id="btn-tender-cash"
                disabled={cart.length === 0}
                onClick={() => handleOpenTender('cash')}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Banknote className="w-4 h-4" />
                <span>Cash Tender</span>
              </button>

              <button
                id="btn-tender-card"
                disabled={cart.length === 0}
                onClick={() => handleOpenTender('credit_card')}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Card / Digital</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCE SCALE / WEIGHT MODAL */}
      {weightedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{weightedProduct.name}</h3>
                <p className="text-xs text-slate-500">
                  ${weightedProduct.sellingPrice.toFixed(2)} / {weightedProduct.unit}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Enter Measured Weight (kg):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  value={produceWeight}
                  onChange={(e) => setProduceWeight(e.target.value)}
                  className="w-full text-2xl font-mono font-bold text-slate-900 py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="font-bold text-slate-600 text-sm">kg</span>
              </div>

              {/* Quick weight shortcuts */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {['0.50', '1.00', '1.50', '2.00'].map((w) => (
                  <button
                    key={w}
                    onClick={() => setProduceWeight(w)}
                    className="py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-sky-500 rounded-md transition-colors"
                  >
                    {w}kg
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">Calculated Line Total:</span>
                <span className="font-extrabold text-sky-700">
                  ${((parseFloat(produceWeight) || 0) * weightedProduct.sellingPrice).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setWeightedProduct(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWeight}
                className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT / TENDER MODAL */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Process Checkout</h3>
                <p className="text-xs text-slate-500">Select payment tender and complete sale</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Amount Due</div>
                <div className="text-xl font-black text-emerald-700">
                  ${cartTotals.total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('credit_card')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedPaymentMethod === 'credit_card'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card (POS)</span>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('e_wallet')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  selectedPaymentMethod === 'e_wallet'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>E-Wallet</span>
              </button>
            </div>

            {/* Cash Tender Calculation */}
            {selectedPaymentMethod === 'cash' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Cash Received:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={cartTotals.total}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full text-xl font-bold font-mono pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick denomination buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                  {[
                    Math.ceil(cartTotals.total),
                    Math.ceil(cartTotals.total / 10) * 10 || 10,
                    20,
                    50,
                  ].map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashTendered(val.toFixed(2))}
                      className="py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-emerald-500 rounded transition-colors"
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                {/* Change return calculation */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Change Due to Shopper:</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Customer optional name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Customer Name / Member ID (Optional):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Shopper"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Modal actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsTenderModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-checkout"
                onClick={handleExecuteCheckout}
                className="flex-2 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Complete Transaction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELD ORDERS MODAL */}
      {heldOrdersModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 mb-3">Held / Parked Grocery Baskets</h3>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mb-4">
              {heldOrders.map((held) => {
                const heldTotal = held.cart.reduce((s, c) => s + c.totalPrice, 0);
                return (
                  <div key={held.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{held.customerNote}</div>
                      <div className="text-[11px] text-slate-500">
                        {held.cart.length} items • ${heldTotal.toFixed(2)} • {new Date(held.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          recallOrder(held.id);
                          setHeldOrdersModalOpen(false);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Recall
                      </button>
                      <button
                        onClick={() => deleteHeldOrder(held.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setHeldOrdersModalOpen(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Barcode Scanner Viewfinder Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeScanned}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        sale={lastSale}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
