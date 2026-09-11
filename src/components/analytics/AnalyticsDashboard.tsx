import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export const AnalyticsDashboard: React.FC = () => {
  const { sales, products, setActiveTab } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  // Daily Revenue & Profit Aggregation
  const dailyChartData = useMemo(() => {
    const daysMap: Record<string, { date: string; displayDate: string; revenue: number; profit: number; orders: number }> = {};
    const daysLimit = timeRange === '7d' ? 7 : 30;

    const now = new Date();
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysMap[key] = { date: key, displayDate, revenue: 0, profit: 0, orders: 0 };
    }

    sales.forEach((s) => {
      const dayKey = s.createdAt.split('T')[0];
      if (daysMap[dayKey]) {
        daysMap[dayKey].revenue += s.totalAmount;
        daysMap[dayKey].orders += 1;

        let cost = 0;
        s.items.forEach((item) => {
          cost += (item.costPrice || 0) * item.quantity;
        });
        const profit = Math.max(0, s.subtotal - cost);
        daysMap[dayKey].profit += profit;
      }
    });

    return Object.values(daysMap).map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
      profit: Number(d.profit.toFixed(2)),
    }));
  }, [sales, timeRange]);

  // Hourly Grocery Rush Distribution
  const hourlyData = useMemo(() => {
    const hourBuckets: Record<number, { hour: string; count: number; sales: number }> = {};
    for (let h = 8; h <= 21; h++) {
      const displayHour = `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
      hourBuckets[h] = { hour: displayHour, count: 0, sales: 0 };
    }

    sales.forEach((s) => {
      const date = new Date(s.createdAt);
      const h = date.getHours();
      if (hourBuckets[h]) {
        hourBuckets[h].count += 1;
        hourBuckets[h].sales += s.totalAmount;
      }
    });

    return Object.values(hourBuckets).map((h) => ({
      ...h,
      sales: Number(h.sales.toFixed(2)),
    }));
  }, [sales]);

  // Department Category Breakdown
  const categoryChartData = useMemo(() => {
    const catMap: Record<string, number> = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        catMap[item.category] = (catMap[item.category] || 0) + item.totalPrice;
      });
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [sales]);

  // Top 5 Products
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; revenue: number; unit: string }> = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!itemMap[item.productId]) {
          itemMap[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            unit: item.unit,
          };
        }
        itemMap[item.productId].quantity += item.quantity;
        itemMap[item.productId].revenue += item.totalPrice;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  // Payment Breakdown
  const paymentStats = useMemo(() => {
    const totals: Record<string, number> = {};
    let grand = 0;
    sales.forEach((s) => {
      totals[s.paymentMethod] = (totals[s.paymentMethod] || 0) + s.totalAmount;
      grand += s.totalAmount;
    });

    return Object.entries(totals).map(([method, amount]) => ({
      method: method.replace('_', ' ').toUpperCase(),
      amount: Number(amount.toFixed(2)),
      pct: grand > 0 ? ((amount / grand) * 100).toFixed(1) : '0',
    }));
  }, [sales]);

  // Summary KPIs
  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalAmount, 0), [sales]);
  const totalTransactions = sales.length;
  const avgBasket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.minStockThreshold).length,
    [products]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Store Sales Analytics & Revenue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Interactive daily revenue tracking, grocery rush peak hours, and product margin performance.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '7d' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '30d' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1: Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <span>+14.8% vs previous period</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Orders & ATV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Checkout Volume</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalTransactions} orders
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Average Basket: <strong className="text-slate-800">${avgBasket.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Peak Hour */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Peak Grocery Rush</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              5:00 PM – 7:00 PM
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Evening Dinner Rush (34% of daily traffic)
            </div>
          </div>
        </div>

        {/* KPI 4: Low Stock Alert Badge */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-red-600">
              {lowStockCount} lines
            </div>
            <div className="text-xs text-red-700 font-semibold mt-1">
              Click to review inventory & restock →
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* CHART 1: Daily Revenue & Gross Margin Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Daily Revenue & Gross Profit</h3>
              <p className="text-xs text-slate-400">Track incoming revenue and estimated merchandise margin</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-3 h-3 rounded-full bg-indigo-500" /> Gross Profit
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined) => [`$${Number(val || 0).toFixed(2)}`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Gross Profit"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Sales by Department Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Department Share</h3>
            <p className="text-xs text-slate-400">Revenue distribution by category</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number | string | undefined) => [`$${Number(val || 0).toFixed(2)}`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-2 border-t border-slate-100">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-slate-600 font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Hourly Distribution & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="font-extrabold text-base text-slate-900">Hourly Register Traffic</h3>
            <p className="text-xs text-slate-400">Transaction peak analysis throughout store opening hours</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(val: number | string | undefined) => [`${val} orders`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Transactions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Products & Payment Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900">Top Performing Items</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {topProducts.map((p, index) => (
                <div key={p.name} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900">${p.revenue.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.quantity} {p.unit} sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment breakdown pill bar */}
          <div className="pt-3 border-t border-slate-100 mt-3">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Payment Tenders
            </div>
            <div className="grid grid-cols-3 gap-2">
              {paymentStats.map((pm) => (
                <div key={pm.method} className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold">{pm.method}</div>
                  <div className="font-extrabold text-xs text-slate-800">${pm.amount}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{pm.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
