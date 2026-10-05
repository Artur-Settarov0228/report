import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllOrders } from '../api/orders';
import { getAllPayments } from '../api/payments';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, ChevronDown, TrendingUp, TrendingDown, Package, Clock, X, AlertCircle, Download } from 'lucide-react';
import { isToday, isYesterday, subDays, format, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Order } from '../types';
import * as XLSX from 'xlsx';

// Utility for currency formatting
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('ru-RU').replace(',', ' ') + " so'm";
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="font-bold text-gray-900 text-lg">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// Skeleton Loading
const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
  </div>
);

// Order Detail Modal
const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  if (!order) return null;
  const statusColor = order.status === 'PAID' || order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
  const statusText = order.status === 'PAID' || order.status === 'COMPLETED' ? 'To‘langan' :
                     order.status === 'OPEN' ? 'Ochiq' : 'Bekor qilingan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">#ORD-{order.id.toString().padStart(4, '0')}</h3>
            <p className="text-gray-500 font-medium">Stol {order.table_id || '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} className="text-gray-500" /></button>
        </div>
        
        <div className="mb-4">
          <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Mahsulotlar</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-800">{item.product?.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex justify-between items-center text-lg font-black text-gray-900">
            <span>Jami:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
          <span className="text-sm font-bold text-gray-500 uppercase">Status:</span>
          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${statusColor}`}>{statusText}</span>
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(7);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Queries
  const { data: orders = [], isLoading: loadingOrders, isError: errorOrders } = useQuery({ queryKey: ['reports', 'orders'], queryFn: getAllOrders });
  const { data: payments = [], isLoading: loadingPayments, isError: errorPayments } = useQuery({ queryKey: ['reports', 'payments'], queryFn: getAllPayments });
  const { data: products = [], isLoading: loadingProducts, isError: errorProducts } = useQuery({ queryKey: ['reports', 'products'], queryFn: getProducts });
  const { data: categories = [], isLoading: loadingCategories, isError: errorCategories } = useQuery({ queryKey: ['reports', 'categories'], queryFn: getCategories });

  const isLoading = loadingOrders || loadingPayments || loadingProducts || loadingCategories;
  const isError = errorOrders || errorPayments || errorProducts || errorCategories;

  // Processed Data
  const { summary, chartData, topProducts, paymentMethods, orderStatuses, recentOrders } = useMemo(() => {
    if (isLoading || isError) return { summary: null, chartData: [], topProducts: [], paymentMethods: [], orderStatuses: [], recentOrders: [] };

    const now = new Date();
    const startDate = startOfDay(subDays(now, dateRange - 1));

    // Valid statuses for revenue calculation
    const validStatuses = ['PAID', 'COMPLETED'];

    // Filter orders within date range
    const rangeOrders = orders.filter(o => isAfter(parseISO(o.created_at), startDate));
    const rangeValidOrders = rangeOrders.filter(o => validStatuses.includes(o.status));

    // Summary Cards
    const todayOrders = orders.filter(o => isToday(parseISO(o.created_at)));
    const todayValidOrders = todayOrders.filter(o => validStatuses.includes(o.status));
    const todayRevenue = todayValidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const avgOrderValue = todayValidOrders.length > 0 ? todayRevenue / todayValidOrders.length : 0;
    
    const yesterdayOrders = orders.filter(o => isYesterday(parseISO(o.created_at)));
    const yesterdayValidOrders = yesterdayOrders.filter(o => validStatuses.includes(o.status));
    const yesterdayRevenue = yesterdayValidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const yesterdayAvg = yesterdayValidOrders.length > 0 ? yesterdayRevenue / yesterdayValidOrders.length : 0;

    const revDiff = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    const ordDiff = yesterdayOrders.length > 0 ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 : 0;
    const avgDiff = yesterdayAvg > 0 ? ((avgOrderValue - yesterdayAvg) / yesterdayAvg) * 100 : 0;

    const summary = {
      todayRevenue, revDiff, yesterdayRevenue,
      todayOrders: todayOrders.length, ordDiff, yesterdayOrders: yesterdayOrders.length,
      avgOrderValue, avgDiff, yesterdayAvg,
      openOrders: orders.filter(o => o.status === 'OPEN').length, totalOrders: orders.length
    };

    // Revenue Chart Data
    const chartMap = new Map<string, number>();
    for (let i = dateRange - 1; i >= 0; i--) {
      chartMap.set(format(subDays(now, i), 'd MMM', { locale: uz }), 0);
    }
    
    rangeValidOrders.forEach(o => {
      const dateStr = format(parseISO(o.created_at), 'd MMM', { locale: uz });
      if (chartMap.has(dateStr)) {
        chartMap.set(dateStr, chartMap.get(dateStr)! + Number(o.total_amount));
      }
    });
    const chartData = Array.from(chartMap.entries()).map(([date, amount]) => ({ date, amount }));

    // Top Products
    const productMap = new Map<string, { qty: number, rev: number, category: string, image?: string }>();
    rangeValidOrders.forEach(o => {
      o.items?.forEach(i => {
        const name = i.product_name || 'Unknown';
        const product = products.find(p => p.id === i.product_id);
        let catName = 'Mahsulot';
        if (product) {
          const cat = categories.find(c => c.id === product.category_id);
          if (cat) catName = cat.name;
        }
        
        const existing = productMap.get(name) || { qty: 0, rev: 0, category: catName, image: product?.image_url || undefined };
        productMap.set(name, {
          qty: existing.qty + i.quantity,
          rev: existing.rev + Number(i.subtotal),
          category: existing.category,
          image: existing.image
        });
      });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Payment Methods
    const rangePayments = payments.filter(p => isAfter(parseISO(p.created_at), startDate));
    const payMap = new Map<string, number>([['Naqd', 0], ['Karta', 0], ['Click', 0], ['Payme', 0]]);
    let totalPay = 0;
    rangePayments.forEach(p => {
      const amt = Number(p.amount);
      totalPay += amt;
      if (p.method === 'CASH') payMap.set('Naqd', payMap.get('Naqd')! + amt);
      else if (p.method === 'CARD') payMap.set('Karta', payMap.get('Karta')! + amt);
      else if (p.method === 'CLICK') payMap.set('Click', payMap.get('Click')! + amt);
      else if (p.method === 'PAYME') payMap.set('Payme', payMap.get('Payme')! + amt);
    });
    const paymentMethods = Array.from(payMap.entries()).map(([name, value]) => ({ 
      name, value, percent: totalPay > 0 ? Math.round((value / totalPay) * 100) : 0 
    }));

    // Order Statuses
    let totalStatus = rangeOrders.length;
    const statusMap = new Map<string, number>([['To‘langan', 0], ['Ochiq', 0], ['Bekor qilingan', 0]]);
    rangeOrders.forEach(o => {
      if (o.status === 'PAID' || o.status === 'COMPLETED') statusMap.set('To‘langan', statusMap.get('To‘langan')! + 1);
      else if (o.status === 'OPEN') statusMap.set('Ochiq', statusMap.get('Ochiq')! + 1);
      else statusMap.set('Bekor qilingan', statusMap.get('Bekor qilingan')! + 1);
    });
    const orderStatuses = Array.from(statusMap.entries()).map(([name, value]) => ({ 
      name, value, percent: totalStatus > 0 ? Math.round((value / totalStatus) * 100) : 0 
    }));

    // Recent Orders
    const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

    return { summary, chartData, topProducts, paymentMethods, orderStatuses, recentOrders };
  }, [orders, payments, products, categories, dateRange, isLoading, isError]);

  const COLORS = {
    Naqd: '#f97316', // orange
    Karta: '#3b82f6', // blue
    Click: '#22c55e', // green
    Payme: '#a855f7', // purple
    'To‘langan': '#f97316', // orange
    'Ochiq': '#3b82f6', // blue
    'Bekor qilingan': '#ef4444' // red
  };

  const startFormatted = format(subDays(new Date(), dateRange - 1), 'dd.MM.yyyy');
  const endFormatted = format(new Date(), 'dd.MM.yyyy');


  const handleExportExcel = () => {
    const rangeValidOrders = orders.filter(o => isAfter(parseISO(o.created_at), startOfDay(subDays(new Date(), dateRange - 1))) && (o.status === 'PAID' || o.status === 'COMPLETED'));

    // 1. Kunlik (Daily)
    const dailyMap = new Map();
    rangeValidOrders.forEach(o => {
      const dateStr = format(parseISO(o.created_at), 'dd.MM.yyyy');
      const curr = dailyMap.get(dateStr) || { orders: 0, revenue: 0 };
      dailyMap.set(dateStr, { orders: curr.orders + 1, revenue: curr.revenue + Number(o.total_amount) });
    });
    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      'Sana': date,
      'Buyurtmalar soni': data.orders,
      'Daromad (so`m)': data.revenue
    }));

    // 2. Haftalik (Weekly)
    const weeklyMap = new Map();
    rangeValidOrders.forEach(o => {
      const weekStr = format(parseISO(o.created_at), "II-'hafta', yyyy"); 
      const curr = weeklyMap.get(weekStr) || { orders: 0, revenue: 0 };
      weeklyMap.set(weekStr, { orders: curr.orders + 1, revenue: curr.revenue + Number(o.total_amount) });
    });
    const weeklyData = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      'Hafta': week,
      'Buyurtmalar soni': data.orders,
      'Daromad (so`m)': data.revenue
    }));

    // 3. Oylik (Monthly)
    const monthlyMap = new Map();
    rangeValidOrders.forEach(o => {
      const monthStr = format(parseISO(o.created_at), 'MMMM yyyy', { locale: uz }); 
      const curr = monthlyMap.get(monthStr) || { orders: 0, revenue: 0 };
      monthlyMap.set(monthStr, { orders: curr.orders + 1, revenue: curr.revenue + Number(o.total_amount) });
    });
    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      'Oy': month,
      'Buyurtmalar soni': data.orders,
      'Daromad (so`m)': data.revenue
    }));

    // 4. Mahsulotlar (Top Products for the range)
    const productsData = topProducts.map((p, idx) => ({
      '#': idx + 1,
      'Mahsulot': p.name,
      'Kategoriya': p.category,
      'Sotilgan soni': p.qty,
      'Tushum (so`m)': p.rev
    }));

    // 5. To'lov usullari
    const paymentsData = paymentMethods.map(p => ({
      'To`lov usuli': p.name,
      'Tushum (so`m)': p.value,
      'Ulushi (%)': p.percent
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyData), 'Kunlik');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weeklyData), 'Haftalik');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlyData), 'Oylik');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsData), 'Mahsulotlar');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsData), 'To`lovlar');

    XLSX.writeFile(wb, `Hisobot_${startFormatted}_${endFormatted}.xlsx`);
  };

  if (isError) {

    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50">
        <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Hisobotlarni yuklab bo‘lmadi.</h2>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Qayta urinish</button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col bg-gray-50 overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-1">Hisobotlar</h2>
            <p className="text-slate-500 font-medium">Restoran daromadi va analitikasi</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <Calendar size={16} className="text-primary" />
              {startFormatted} - {endFormatted}
            </div>
            <div className="flex bg-slate-200/60 p-1 rounded-xl">
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold bg-green-500 text-white shadow hover:bg-green-600 transition mr-2"
                title="Excel yuklab olish"
              >
                <Download size={16} /> Excel
              </button>
              {[7, 30, 90].map(days => (
                <button 
                  key={days}
                  onClick={() => setDateRange(days as 7|30|90)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${dateRange === days ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {days} kun
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {isLoading ? (
            Array(4).fill(0).map((_,i) => <SkeletonCard key={i} />)
          ) : summary ? (
            <>
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-bold uppercase mb-2">Bugungi Tushum</p>
                <p className="text-2xl font-black text-slate-900 mb-3">{formatCurrency(summary.todayRevenue)}</p>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center text-xs font-bold ${summary.revDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.revDiff >= 0 ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                    {summary.revDiff > 0 ? '+' : ''}{summary.revDiff.toFixed(1)}%
                  </div>
                  <span className="text-xs font-medium text-slate-400">Kecha: {formatCurrency(summary.yesterdayRevenue).replace(" so'm","")}</span>
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-bold uppercase mb-2">Bugungi Buyurtmalar</p>
                <p className="text-2xl font-black text-slate-900 mb-3">{summary.todayOrders} <span className="text-sm font-bold text-slate-400">ta</span></p>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center text-xs font-bold ${summary.ordDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.ordDiff >= 0 ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                    {summary.ordDiff > 0 ? '+' : ''}{summary.ordDiff.toFixed(1)}%
                  </div>
                  <span className="text-xs font-medium text-slate-400">Kecha: {summary.yesterdayOrders} ta</span>
                </div>
              </div>
              {/* Card 3 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-bold uppercase mb-2">O‘rtacha Chek</p>
                <p className="text-2xl font-black text-slate-900 mb-3">{formatCurrency(summary.avgOrderValue)}</p>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center text-xs font-bold ${summary.avgDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.avgDiff >= 0 ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                    {summary.avgDiff > 0 ? '+' : ''}{summary.avgDiff.toFixed(1)}%
                  </div>
                  <span className="text-xs font-medium text-slate-400">Kecha: {formatCurrency(summary.yesterdayAvg).replace(" so'm","")}</span>
                </div>
              </div>
              {/* Card 4 */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-bold uppercase mb-2">Ochiq Buyurtmalar</p>
                <p className="text-2xl font-black text-slate-900 mb-3">{summary.openOrders} <span className="text-sm font-bold text-slate-400">ta</span></p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Jami buyurtmalar: {summary.totalOrders}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Chart & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">So‘nggi {dateRange} kundagi daromad</h3>
              <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1 cursor-pointer">
                Daromad (so'm) <ChevronDown size={14}/>
              </div>
            </div>
            {isLoading ? (
              <div className="h-72 bg-slate-50 rounded-xl animate-pulse"></div>
            ) : chartData.length === 0 || summary?.totalOrders === 0 ? (
              <div className="h-72 flex items-center justify-center text-slate-400 font-medium">Hozircha ma'lumot mavjud emas.</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(val) => val === 0 ? '0' : `${(val/1000).toFixed(0)}k`}
                      dx={-10}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Eng ko‘p sotilganlar</h3>
              <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                {dateRange} kun <ChevronDown size={14} className="inline"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {isLoading ? (
                Array(5).fill(0).map((_,i) => <div key={i} className="flex gap-4 animate-pulse"><div className="w-12 h-12 bg-slate-100 rounded-xl"></div><div className="flex-1"><div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div><div className="h-3 bg-slate-100 rounded w-1/4"></div></div></div>)
              ) : topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium pb-10 text-center">Tanlangan davrda<br/>ma'lumot yo'q</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black text-xs">
                      {idx + 1}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                      {p.image ? <img src={p.image} className="w-full h-full object-cover"/> : <Package size={20} className="text-slate-300"/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{p.qty} <span className="text-xs font-bold text-slate-400">ta</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Payments, Statuses, Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900 mb-6">To‘lov usullari</h3>
            {isLoading ? (
              <div className="h-48 bg-slate-50 rounded-xl animate-pulse"></div>
            ) : paymentMethods.every(p => p.value === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 font-medium">To'lovlar yo'q</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-1/2 h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMethods} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-sm font-black text-slate-900 leading-tight">{formatCurrency(paymentMethods.reduce((a,b)=>a+b.value,0)).split(' ')[0]}</p>
                    <p className="text-[10px] font-bold text-slate-400">so'm</p>
                  </div>
                </div>
                <div className="w-1/2 space-y-3">
                  {paymentMethods.filter(p => p.value > 0).map(p => (
                    <div key={p.name}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: (COLORS as any)[p.name]}}></div>
                          <span className="text-sm font-bold text-slate-700">{p.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{p.percent}%</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 pl-4">{formatCurrency(p.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Statuses */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-black text-slate-900 mb-6">Buyurtmalar holati</h3>
            {isLoading ? (
              <div className="h-48 bg-slate-50 rounded-xl animate-pulse"></div>
            ) : orderStatuses.every(s => s.value === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 font-medium">Buyurtmalar yo'q</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-1/2 h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderStatuses} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                        {orderStatuses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-black text-slate-900 leading-tight">{orderStatuses.reduce((a,b)=>a+b.value,0)}</p>
                    <p className="text-xs font-bold text-slate-400">ta</p>
                  </div>
                </div>
                <div className="w-1/2 space-y-3">
                  {orderStatuses.filter(s => s.value > 0).map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: (COLORS as any)[s.name]}}></div>
                          <span className="text-sm font-bold text-slate-700 leading-tight">{s.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{s.percent}%</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 pl-4">{s.value} ta</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">So‘nggi buyurtmalar</h3>
              <div className="text-primary hover:text-orange-600 transition cursor-pointer text-sm font-bold">→</div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3">#</th>
                    <th className="pb-3">Stol</th>
                    <th className="pb-3">Summa</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-sm text-slate-400">Yuklanmoqda...</td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">Ma'lumot yo'q</td></tr>
                  ) : (
                    recentOrders.map(o => {
                      const statusColor = o.status === 'PAID' || o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                          o.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
                      const statusText = o.status === 'PAID' || o.status === 'COMPLETED' ? 'To‘langan' :
                                         o.status === 'OPEN' ? 'Ochiq' : 'Bekor qilingan';
                      return (
                        <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-slate-50 cursor-pointer transition">
                          <td className="py-3 pr-2 font-bold text-slate-800 text-sm">#ORD-{o.id.toString().padStart(4,'0')}</td>
                          <td className="py-3 px-2 font-bold text-slate-600 text-sm">{o.table_id || '-'}</td>
                          <td className="py-3 px-2 font-black text-slate-900 text-sm">{formatCurrency(o.total_amount).replace(" so'm","")}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>{statusText}</span>
                          </td>
                          <td className="py-3 pl-2 text-right text-xs font-bold text-slate-400">
                            {format(parseISO(o.created_at), 'HH:mm')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
