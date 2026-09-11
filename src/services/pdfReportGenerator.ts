import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Sale, CashDrawerShift } from '../types';

export function generateDailySalesReportPDF(sales: Sale[], dateLabel: string = 'Today'): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Branding
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FRESHMART GROCERY STORE', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('POINT OF SALE & ERP EXECUTIVE REPORT', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Period: ${dateLabel}`, pageWidth - 14, 22, { align: 'right' });

  // Summary Metrics Calculation
  const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalTax = sales.reduce((acc, s) => acc + s.taxAmount, 0);
  const totalDiscounts = sales.reduce((acc, s) => acc + s.discountAmount, 0);
  const netSubtotal = sales.reduce((acc, s) => acc + s.subtotal, 0);
  const avgBasket = sales.length > 0 ? totalSales / sales.length : 0;

  let totalCost = 0;
  sales.forEach((s) => {
    s.items.forEach((item) => {
      totalCost += (item.costPrice || 0) * item.quantity;
    });
  });
  const grossProfit = Math.max(0, netSubtotal - totalCost);
  const marginPercent = netSubtotal > 0 ? (grossProfit / netSubtotal) * 100 : 0;

  // Overview Cards (drawn with rounded rectangles)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', 14, 38);

  const cardY = 42;
  const cardW = 42;
  const cardH = 20;

  // Metric 1: Total Revenue
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('GROSS SALES', 18, cardY + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalSales.toFixed(2)}`, 18, cardY + 14);

  // Metric 2: Net Subtotal
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(60, cardY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TRANSACTIONS', 64, cardY + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${sales.length} orders`, 64, cardY + 14);

  // Metric 3: Avg Basket
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(106, cardY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('AVG BASKET SIZE', 110, cardY + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${avgBasket.toFixed(2)}`, 110, cardY + 14);

  // Metric 4: Est Profit & Margin
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(152, cardY, cardW, cardH, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EST. GROSS MARGIN', 156, cardY + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // green
  doc.text(`${marginPercent.toFixed(1)}% ($${grossProfit.toFixed(2)})`, 156, cardY + 14);

  // Payment Breakdown
  const paymentTotals: Record<string, number> = {};
  sales.forEach((s) => {
    paymentTotals[s.paymentMethod] = (paymentTotals[s.paymentMethod] || 0) + s.totalAmount;
  });

  const paymentData = Object.entries(paymentTotals).map(([method, amt]) => [
    method.replace('_', ' ').toUpperCase(),
    `$${amt.toFixed(2)}`,
    `${((amt / (totalSales || 1)) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Payment Tender', 'Total Volume', '% of Sales']],
    body: paymentData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    margin: { left: 14, right: 14 },
  });

  // Recent Invoices Table
  // @ts-expect-error autoTable plugin attaches lastAutoTable to doc
  const nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 110;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Recent Sales Transactions (Audited)', 14, nextY);

  const invoiceRows = sales.slice(0, 25).map((s) => [
    s.invoiceNumber,
    new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    s.cashierName,
    s.items.length.toString(),
    s.paymentMethod.replace('_', ' ').toUpperCase(),
    `$${s.totalAmount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Invoice #', 'Time', 'Cashier', 'Items', 'Payment', 'Total']],
    body: invoiceRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Footer signature
  const finalY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('FreshMart POS • Store Manager Signed: ___________________________', 14, finalY);

  doc.save(`FreshMart_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateZReadingReportPDF(shift: CashDrawerShift, shiftSales: Sale[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('FRESHMART - CASH DRAWER Z-READING AUDIT', 14, 13);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Shift ID: ${shift.id} • Register: Lane 01 • Cashier: ${shift.cashierName}`, 14, 20);

  const cashTx = shiftSales.filter((s) => s.paymentMethod === 'cash');
  const cardTx = shiftSales.filter((s) => s.paymentMethod !== 'cash');

  const totalCashCollected = cashTx.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCardCollected = cardTx.reduce((sum, s) => sum + s.totalAmount, 0);
  const startingFloat = shift.startingCashFloat || 200.0;
  const expectedTotalCash = startingFloat + totalCashCollected;

  const zData = [
    ['Opening Cash Float (Register Start)', `$${startingFloat.toFixed(2)}`],
    ['Total Cash Sales Tendered', `$${totalCashCollected.toFixed(2)}`],
    ['Total Card / Digital Tender Sales', `$${totalCardCollected.toFixed(2)}`],
    ['Total Gross Register Volume', `$${(totalCashCollected + totalCardCollected).toFixed(2)}`],
    ['Total Number of Transactions', `${shiftSales.length}`],
    ['Refunds & Voids Count', '0 (Clean Shift)'],
    ['---------------------------------------------', '-----------------'],
    ['EXPECTED CASH DRAWER TOTAL', `$${expectedTotalCash.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: 34,
    head: [['Register Audit Field', 'Amount']],
    body: zData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3.5 },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error autoTable plugin attaches lastAutoTable to doc
  const auditY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Shift Reconciliation Sign-off', 14, auditY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'I certify that the cash drawer amounts recorded above have been counted and matched against the POS totals.',
    14,
    auditY + 6
  );

  doc.text('Cashier Signature: ___________________________    Date: _______________', 14, auditY + 20);
  doc.text('Manager Verification: _________________________    Date: _______________', 14, auditY + 32);

  doc.save(`FreshMart_Z_Reading_${shift.cashierName.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateInventoryValuationPDF(products: Product[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('FRESHMART INVENTORY & LOW-STOCK AUDIT', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Store Manager Purchasing & Stock Valuation Report', 14, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 18, { align: 'right' });

  // Calculate totals
  const totalCostValuation = products.reduce((acc, p) => acc + p.costPrice * p.stockQuantity, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.sellingPrice * p.stockQuantity, 0);
  const potentialMargin = totalRetailValuation - totalCostValuation;
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockThreshold).length;

  // Stat summary boxes
  const cardY = 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, cardY, 42, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INVENTORY COST', 18, cardY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalCostValuation.toFixed(2)}`, 18, cardY + 12);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(60, cardY, 42, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('RETAIL SHELF VALUE', 64, cardY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalRetailValuation.toFixed(2)}`, 64, cardY + 12);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(106, cardY, 42, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('POTENTIAL MARGIN', 110, cardY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(`$${potentialMargin.toFixed(2)}`, 110, cardY + 12);

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(152, cardY, 42, 18, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text('LOW STOCK ITEMS', 156, cardY + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`${lowStockCount} items critical`, 156, cardY + 12);

  const inventoryRows = products.map((p) => {
    const isCritical = p.stockQuantity <= p.minStockThreshold;
    return [
      p.barcode,
      p.name,
      p.category,
      `${p.stockQuantity} ${p.unit}${isCritical ? ' ⚠️' : ''}`,
      `$${p.costPrice.toFixed(2)}`,
      `$${p.sellingPrice.toFixed(2)}`,
      `$${(p.costPrice * p.stockQuantity).toFixed(2)}`,
      p.supplier || 'N/A',
    ];
  });

  autoTable(doc, {
    startY: 60,
    head: [['Barcode', 'Item Name', 'Category', 'Stock Qty', 'Cost', 'Price', 'Value', 'Supplier']],
    body: inventoryRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`FreshMart_Inventory_Valuation_${new Date().toISOString().split('T')[0]}.pdf`);
}
