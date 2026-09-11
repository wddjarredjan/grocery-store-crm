import React from 'react';
import { Printer, CheckCircle, X, Download } from 'lucide-react';
import { Sale } from '../../types';

interface ThermalReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Top Notification bar */}
        <div className="bg-emerald-600 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Payment Successful!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body (with thermal paper print ID) */}
        <div className="p-6 bg-slate-100/60 max-h-[70vh] overflow-y-auto">
          <div
            id="thermal-receipt"
            className="bg-white p-6 shadow-sm border border-slate-200 font-mono text-xs text-slate-800 mx-auto rounded-md"
            style={{ width: '100%', maxWidth: '340px' }}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-base tracking-wider text-slate-900">FRESHMART GROCERY</h2>
              <p className="text-[11px] text-slate-600">Store #104 • Central Valley</p>
              <p className="text-[10px] text-slate-500">Tel: (555) 382-9901</p>
              <p className="text-[10px] text-slate-500 mt-1">Tax ID: US-84-9920193-G</p>
            </div>

            {/* Transaction Details */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>REGISTER:</span>
                <span>LANE-01</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-slate-200 uppercase">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty</span>
                <span className="w-1/4 text-right">Price</span>
              </div>

              <div className="divide-y divide-slate-100 pt-1.5 space-y-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="flex justify-between font-medium">
                      <span className="w-1/2 truncate">{item.name}</span>
                      <span className="w-1/4 text-center text-slate-600">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="w-1/4 text-right font-bold">${item.totalPrice.toFixed(2)}</span>
                    </div>
                    {item.discountPercent > 0 && (
                      <div className="text-[10px] text-emerald-600">
                        Discount ({item.discountPercent}% off applied)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Savings:</span>
                  <span>-${sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (7%):</span>
                <span>${sale.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL DUE:</span>
                <span>${sale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Tender:</span>
                <span className="font-semibold uppercase">{sale.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tendered:</span>
                <span>${sale.amountTendered.toFixed(2)}</span>
              </div>
              {sale.paymentMethod === 'cash' && (
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>CHANGE GIVEN:</span>
                  <span>${sale.changeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-4 space-y-1">
              <div className="font-mono text-center tracking-[0.25em] text-[10px] text-slate-400">
                ||| | ||||| |||| | ||||| ||| ||
              </div>
              <p className="text-[9px] text-slate-500">*{sale.invoiceNumber}*</p>
              <p className="text-[10px] text-slate-600 mt-2 font-medium">
                Thank you for shopping local at FreshMart!
              </p>
              <p className="text-[9px] text-slate-400">Keep receipt for returns within 14 days.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Next Order
          </button>
        </div>
      </div>
    </div>
  );
};
