import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/reports';
import { TrendingUp, ShoppingBag, Grid, Receipt, DollarSign, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery({ 
    queryKey: ['dashboard_stats'], 
    queryFn: getDashboardStats,
    refetchInterval: 15000 // auto refresh every 15s
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU').replace(',', ' ') + " so'm";
  };

  if (isError) {
    return <div className="p-8 text-red-500 font-bold">Ma'lumotlarni yuklashda xatolik yuz berdi.</div>;
  }

  const COLORS = {
    CASH: '#f97316', // orange
    CARD: '#3b82f6', // blue
    CLICK: '#22c55e', // green
    PAYME: '#a855f7', // purple
  };

  const paymentData = stats ? [
    { name: 'Naqd', value: Number(stats.payment_breakdown.CASH), fill: COLORS.CASH },
    { name: 'Karta', value: Number(stats.payment_breakdown.CARD), fill: COLORS.CARD },
    { name: 'Click', value: Number(stats.payment_breakdown.CLICK), fill: COLORS.CLICK },
    { name: 'Payme', value: Number(stats.payment_breakdown.PAYME), fill: COLORS.PAYME },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex flex-col bg-gray-50 h-[calc(100vh-0px)] overflow-y-auto font-sans">
      <div className="p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-1">Dashboard</h2>
          <p className="text-gray-500 font-medium">Asosiy ko'rsatkichlar va bugungi holat</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600"><TrendingUp size={20}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Bugungi Tushum</p>
            </div>
            {isLoading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
              <p className="text-3xl font-black text-gray-900">{formatCurrency(stats?.revenue || 0)}</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><ShoppingBag size={20}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Jami Buyurtmalar</p>
            </div>
            {isLoading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
              <p className="text-3xl font-black text-gray-900">{stats?.orders_count || 0} <span className="text-sm font-bold text-gray-400">ta</span></p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600"><Grid size={20}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Band Stollar</p>
            </div>
            {isLoading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
              <p className="text-3xl font-black text-gray-900">{stats?.occupied_tables_count || 0} <span className="text-sm font-bold text-gray-400">ta</span></p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><Receipt size={20}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ochiq Buyurtmalar</p>
            </div>
            {isLoading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
              <p className="text-3xl font-black text-gray-900">{stats?.open_orders_count || 0} <span className="text-sm font-bold text-gray-400">ta</span></p>
            )}
          </div>
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Breakdown */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Wallet size={20} className="text-gray-900" />
              <h3 className="text-xl font-black text-gray-900">To'lov Usullari (Bugun)</h3>
            </div>
            
            {isLoading ? (
              <div className="h-48 bg-gray-50 rounded-xl animate-pulse"></div>
            ) : paymentData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 font-bold">Ma'lumot yo'q</div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-black text-gray-900 leading-tight">{formatCurrency(stats?.revenue || 0).split(' ')[0]}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  {paymentData.map(p => (
                    <div key={p.name}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: p.fill}}></div>
                          <span className="text-sm font-bold text-gray-700">{p.name}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">
                          {Math.round((p.value / Number(stats?.revenue || 1)) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 pl-5">{formatCurrency(p.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions / Info */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-lg text-white flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <TrendingUp size={120} />
             </div>
             <h3 className="text-2xl font-black mb-2 z-10">Kunlik ko'rsatkich</h3>
             <p className="text-gray-400 font-medium mb-8 z-10 max-w-sm">Jami bajarilgan (yopilgan) buyurtmalar va hozirgi faol jarayonlar haqida qisqacha xulosa.</p>
             
             <div className="grid grid-cols-2 gap-4 z-10">
               <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                 <p className="text-xs text-gray-400 font-bold uppercase mb-1">Yopilgan (To'langan)</p>
                 <p className="text-xl font-black">{stats?.completed_orders_count || 0} <span className="text-xs opacity-50">ta</span></p>
               </div>
               <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                 <p className="text-xs text-gray-400 font-bold uppercase mb-1">Kutishda (Ochiq)</p>
                 <p className="text-xl font-black">{stats?.open_orders_count || 0} <span className="text-xs opacity-50">ta</span></p>
               </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
