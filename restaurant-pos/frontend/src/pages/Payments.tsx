import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPayments } from '../api/payments';
import { Search, FileText, AlertCircle, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { Payment } from '../types';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

type DateFilter = 'TODAY' | 'WEEK' | 'MONTH';

export default function Payments() {
  const [activeDate, setActiveDate] = useState<DateFilter>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: payments = [], isLoading, isError } = useQuery({
    queryKey: ['payments'],
    queryFn: getAllPayments,
    refetchInterval: 15000 // auto-refresh every 15s
  });

  // Calculate filtering
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Date Filter
      const paymentDate = parseISO(payment.created_at);
      if (activeDate === 'TODAY' && !isToday(paymentDate)) return false;
      if (activeDate === 'WEEK' && !isThisWeek(paymentDate)) return false;
      if (activeDate === 'MONTH' && !isThisMonth(paymentDate)) return false;

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = `ord-${payment.order_id}`.includes(query) || payment.order_id.toString().includes(query);
        if (!matchesId) return false;
      }

      return true;
    });
  }, [payments, activeDate, searchQuery]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    return {
      total: filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      cash: filteredPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0),
      card: filteredPayments.filter(p => p.method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0),
      online: filteredPayments.filter(p => p.method === 'CLICK' || p.method === 'PAYME').reduce((sum, p) => sum + Number(p.amount), 0),
    };
  }, [filteredPayments]);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">To'lovlar tarixi</h2>
          <p className="text-gray-500">Barcha qabul qilingan to'lovlar va ularning usullari</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><DollarSign size={16}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase">Jami tushum</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{kpiData.total.toLocaleString()} <span className="text-sm font-bold text-gray-400">so'm</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><DollarSign size={16}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase">Naqd pul</p>
            </div>
            <p className="text-3xl font-black text-green-600">{kpiData.cash.toLocaleString()} <span className="text-sm font-bold opacity-60">so'm</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><CreditCard size={16}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase">Karta (Terminal)</p>
            </div>
            <p className="text-3xl font-black text-blue-600">{kpiData.card.toLocaleString()} <span className="text-sm font-bold opacity-60">so'm</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Smartphone size={16}/></div>
              <p className="text-sm font-bold text-gray-500 uppercase">Click / Payme</p>
            </div>
            <p className="text-3xl font-black text-purple-600">{kpiData.online.toLocaleString()} <span className="text-sm font-bold opacity-60">so'm</span></p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full xl:w-auto">
            <button onClick={() => setActiveDate('TODAY')} className={`flex-1 xl:flex-none px-6 py-2 rounded-lg font-bold text-sm transition ${activeDate === 'TODAY' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Bugun</button>
            <button onClick={() => setActiveDate('WEEK')} className={`flex-1 xl:flex-none px-6 py-2 rounded-lg font-bold text-sm transition ${activeDate === 'WEEK' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Hafta</button>
            <button onClick={() => setActiveDate('MONTH')} className={`flex-1 xl:flex-none px-6 py-2 rounded-lg font-bold text-sm transition ${activeDate === 'MONTH' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Oy</button>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buyurtma raqami bo'yicha qidirish..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-medium transition"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-12">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500 font-bold flex flex-col items-center">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              Tizimda xatolik yuz berdi. Qayta urinib ko'ring.
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={64} className="mx-auto text-gray-200 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">To'lovlar topilmadi</h3>
              <p className="text-gray-500 mb-6">Tanlangan sanada to'lovlar mavjud emas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4 font-bold">Vaqt</th>
                    <th className="px-6 py-4 font-bold">Buyurtma</th>
                    <th className="px-6 py-4 font-bold">To'lov usuli</th>
                    <th className="px-6 py-4 font-bold text-right">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50/80 transition group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{new Date(payment.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString('uz-UZ')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700">#ORD-{payment.order_id.toString().padStart(4, '0')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                          payment.method === 'CASH' ? 'bg-green-100 text-green-700' :
                          payment.method === 'CARD' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {payment.method === 'CASH' ? 'Naqd pul' :
                           payment.method === 'CARD' ? 'Karta' :
                           payment.method === 'CLICK' ? 'Click' : 'Payme'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900 text-right text-lg">
                        {payment.amount.toLocaleString()} <span className="text-sm font-medium text-gray-500">so'm</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
