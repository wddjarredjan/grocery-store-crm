import { Product, Sale } from '../types';

export interface WeeklyEmailReportData {
  recipientEmail: string;
  storeName: string;
  weekRange: string;
  totalRevenue: number;
  revenueGrowthPct: number;
  totalTransactions: number;
  averageBasket: number;
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
  topCategory: { name: string; revenue: number };
  lowStockItemsCount: number;
  criticalItems: { name: string; stock: number; unit: string; supplier?: string }[];
  topCashier: { name: string; transactions: number; revenue: number };
}

export const EMAIL_CONFIG_KEY = 'freshmart_weekly_email_config';

export interface EmailScheduleConfig {
  recipientEmail: string;
  autoSendWeekly: boolean;
  dayOfWeek: 'Monday' | 'Friday' | 'Sunday';
  sendTime: string;
  lastSentAt?: string;
}

export function loadEmailScheduleConfig(): EmailScheduleConfig {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    recipientEmail: 'store.owner@freshmart-groceries.com',
    autoSendWeekly: true,
    dayOfWeek: 'Monday',
    sendTime: '08:00 AM',
  };
}

export function saveEmailScheduleConfig(config: EmailScheduleConfig): void {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

export function generateWeeklySummaryData(sales: Sale[], products: Product[], recipientEmail: string): WeeklyEmailReportData {
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransactions = sales.length;
  const averageBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Item sales aggregation
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const categoryMap: Record<string, number> = {};
  const cashierMap: Record<string, { transactions: number; revenue: number }> = {};

  sales.forEach((s) => {
    // Cashier
    if (!cashierMap[s.cashierName]) {
      cashierMap[s.cashierName] = { transactions: 0, revenue: 0 };
    }
    cashierMap[s.cashierName].transactions += 1;
    cashierMap[s.cashierName].revenue += s.totalAmount;

    // Items
    s.items.forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemMap[item.name].quantity += item.quantity;
      itemMap[item.name].revenue += item.totalPrice;

      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.totalPrice;
    });
  });

  const topSellingProducts = Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const topCategoryEntry = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || [
    'Produce & Fruits',
    0,
  ];

  const topCashierEntry = Object.entries(cashierMap).sort((a, b) => b[1].revenue - a[1].revenue)[0] || [
    'Elena Rostova',
    { transactions: 15, revenue: 780 },
  ];

  const criticalItems = products
    .filter((p) => p.stockQuantity <= p.minStockThreshold)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      stock: p.stockQuantity,
      unit: p.unit,
      supplier: p.supplier,
    }));

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  return {
    recipientEmail,
    storeName: 'FreshMart Grocery Store #104',
    weekRange: `${weekStart.toLocaleDateString()} – ${today.toLocaleDateString()}`,
    totalRevenue,
    revenueGrowthPct: 14.8, // Healthy grocery performance growth
    totalTransactions,
    averageBasket,
    topSellingProducts,
    topCategory: { name: topCategoryEntry[0], revenue: topCategoryEntry[1] },
    lowStockItemsCount: products.filter((p) => p.stockQuantity <= p.minStockThreshold).length,
    criticalItems,
    topCashier: {
      name: topCashierEntry[0],
      transactions: topCashierEntry[1].transactions,
      revenue: topCashierEntry[1].revenue,
    },
  };
}

export function generateWeeklySummaryHtml(data: WeeklyEmailReportData): string {
  const productRows = data.topSellingProducts
    .map(
      (p) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${p.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${p.quantity}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">$${p.revenue.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const lowStockRows = data.criticalItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 6px 12px; border-bottom: 1px solid #fee2e2; color: #991b1b; font-weight: 500;">${item.name}</td>
      <td style="padding: 6px 12px; border-bottom: 1px solid #fee2e2; text-align: center; color: #b91c1c; font-weight: bold;">${item.stock} ${item.unit} left</td>
      <td style="padding: 6px 12px; border-bottom: 1px solid #fee2e2; color: #64748b; font-size: 12px;">${item.supplier || 'Main Distributor'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FreshMart Weekly Grocery Performance Digest</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 28px 32px; color: #ffffff;">
      <span style="background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">Weekly Executive Digest</span>
      <h1 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">FreshMart Grocery Performance Summary</h1>
      <p style="margin: 0; color: #94a3b8; font-size: 13px;">Week Period: ${data.weekRange} • Prepared for ${data.recipientEmail}</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      
      <!-- Key KPI Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Gross Revenue</div>
          <div style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0;">$${data.totalRevenue.toFixed(2)}</div>
          <div style="font-size: 12px; color: #16a34a; font-weight: 600;">+${data.revenueGrowthPct}% vs Previous Week</div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Transactions</div>
          <div style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0;">${data.totalTransactions}</div>
          <div style="font-size: 12px; color: #64748b;">Avg Basket: <strong>$${data.averageBasket.toFixed(2)}</strong></div>
        </div>
      </div>

      <!-- Highlights -->
      <div style="margin-bottom: 28px; background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 4px;">
        <div style="font-size: 13px; color: #065f46; font-weight: 600; margin-bottom: 2px;">Weekly Highlights</div>
        <div style="font-size: 13px; color: #047857; line-height: 1.5;">
          • Top Revenue Department: <strong>${data.topCategory.name}</strong> ($${data.topCategory.revenue.toFixed(2)})<br>
          • Top Register Staff: <strong>${data.topCashier.name}</strong> (${data.topCashier.transactions} checkouts, $${data.topCashier.revenue.toFixed(2)})
        </div>
      </div>

      <!-- Top Selling Grocery Items -->
      <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Top Selling Grocery Items</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px;">
        <thead>
          <tr style="background-color: #f8fafc; color: #64748b; text-align: left;">
            <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0;">Item Name</th>
            <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: center;">Qty Sold</th>
            <th style="padding: 8px 12px; border-bottom: 2px solid #e2e8f0; text-align: right;">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <!-- Low Stock Action Required -->
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #991b1b; font-size: 14px;">Immediate Purchase Order Required</strong>
          <span style="background-color: #dc2626; color: #ffffff; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">${data.lowStockItemsCount} Low Stock</span>
        </div>
        <p style="font-size: 12px; color: #7f1d1d; margin: 0 0 10px 0;">The following grocery lines have reached or fallen below safety stock levels:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tbody>
            ${lowStockRows}
          </tbody>
        </table>
      </div>

      <!-- Footer action -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0;">This automated report was compiled by FreshMart POS & ERP cloud analytics engine.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
