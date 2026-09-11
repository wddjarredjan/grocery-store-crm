import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Boxes,
  FileCheck,
  CheckCircle,
  Eye,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateDailySalesReportPDF,
  generateZReadingReportPDF,
  generateInventoryValuationPDF,
} from '../../services/pdfReportGenerator';

export const ReportsManager: React.FC = () => {
  const { sales, products, activeShift } = useApp();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadSalesPDF = () => {
    generateDailySalesReportPDF(sales, 'All Available Shifts');
    setDownloadSuccess('Daily Sales Executive Report generated & downloaded!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadZReadingPDF = () => {
    generateZReadingReportPDF(activeShift, sales);
    setDownloadSuccess('Z-Reading Register Audit PDF generated & downloaded!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleDownloadInventoryValuationPDF = () => {
    generateInventoryValuationPDF(products);
    setDownloadSuccess('Inventory Valuation & Reorder PDF generated & downloaded!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const totalCostValuation = products.reduce((acc, p) => acc + p.costPrice * p.stockQuantity, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const grossSalesVolume = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockThreshold).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <span>Store Manager Executive Reports (PDF Export)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate, audit, and download formatted PDF documents for accounting, shift balancing, and purchasing.
        </p>
      </div>

      {downloadSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* 3 Main Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* REPORT 1: Daily Sales & Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Daily Sales & Revenue Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Consolidated sales performance, tax collection, customer discounts, payment tender breakdowns, and itemized transaction log.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Audited Orders:</span>
                <span className="font-bold text-slate-900">{sales.length} transactions</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gross Volume:</span>
                <span className="font-bold text-emerald-700 font-mono">${grossSalesVolume.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-download-sales-pdf"
            onClick={handleDownloadSalesPDF}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Sales PDF</span>
          </button>
        </div>

        {/* REPORT 2: Cashier Shift Z-Reading */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Cash Drawer Z-Reading Audit</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Official register end-of-shift reconciliation with opening float, physical cash expected, credit totals, and manager sign-off lines.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Opening Cash Float:</span>
                <span className="font-bold text-slate-900 font-mono">${activeShift.startingCashFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Expected Drawer Cash:</span>
                <span className="font-bold text-sky-700 font-mono">${activeShift.expectedDrawerCash.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-download-zreading-pdf"
            onClick={handleDownloadZReadingPDF}
            className="mt-6 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Z-Reading PDF</span>
          </button>
        </div>

        {/* REPORT 3: Inventory Valuation & Low Stock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Inventory Valuation & Reorder</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Store asset valuation at wholesale cost vs retail selling price, profit potential, and prioritized items needing supplier reorder.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Retail Shelf Value:</span>
                <span className="font-bold text-slate-900 font-mono">${totalRetailValuation.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Low Stock Items:</span>
                <span className="font-bold text-amber-700">{lowStockCount} lines critical</span>
              </div>
            </div>
          </div>

          <button
            id="btn-download-inventory-pdf"
            onClick={handleDownloadInventoryValuationPDF}
            className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Inventory PDF</span>
          </button>
        </div>
      </div>

      {/* On-Screen Recent Transactions Audit View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Recent Completed Register Transactions</h3>
            <p className="text-xs text-slate-400">Preview of sales data included in the daily PDF export</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {sales.length} Audited Records
          </span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Cashier</th>
                <th className="py-2.5 px-4">Items Count</th>
                <th className="py-2.5 px-4">Tender</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 10).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-medium">{s.cashierName}</td>
                  <td className="py-2.5 px-4 text-slate-600">{s.items.length} items</td>
                  <td className="py-2.5 px-4 uppercase font-semibold text-slate-700 text-[11px]">
                    {s.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-800">
                    ${s.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
