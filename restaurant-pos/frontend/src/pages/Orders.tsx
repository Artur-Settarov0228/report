import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllOrders, updateOrderStatus } from '../api/orders';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, X, AlertCircle } from 'lucide-react';
import { Order } from '../types';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

type StatusTab = 'ALL' | 'OPEN' | 'COMPLETED' | 'CANCELLED';
type DateFilter = 'TODAY' | 'WEEK' | 'MONTH';

import { getTables } from '../api/tables';

export default function Orders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeStatus, setActiveStatus] = useState<StatusTab>('ALL');
  const [activeDate, setActiveDate] = useState<DateFilter>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  });

  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getAllOrders,
    refetchInterval: 10000
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number, status: "OPEN" | "COMPLETED" | "CANCELLED" }) => 
      updateOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setSelectedOrder(updatedOrder);
    }
  });

  const getTableName = (tableId: number | null) => {
    if (!tableId) return 'M/E';
    const t = tables.find(t => t.id === tableId);
    return t ? t.table_number : tableId;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeStatus !== 'ALL' && order.status !== activeStatus) return false;
      
      const orderDate = parseISO(order.created_at);
      if (activeDate === 'TODAY' && !isToday(orderDate)) return false;
      if (activeDate === 'WEEK' && !isThisWeek(orderDate)) return false;
      if (activeDate === 'MONTH' && !isThisMonth(orderDate)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = `ord-${order.id}`.includes(query) || order.id.toString().includes(query);
        const matchesTable = `stol ${getTableName(order.table_id)}`.toLowerCase().includes(query) || getTableName(order.table_id)?.toString().toLowerCase() === query;
        if (!matchesId && !matchesTable) return false;
      }
      return true;
    });
  }, [orders, activeStatus, activeDate, searchQuery, tables]);

  const kpiData = useMemo(() => {
    const periodOrders = orders.filter(o => {
      const d = parseISO(o.created_at);
      if (activeDate === 'TODAY') return isToday(d);
      if (activeDate === 'WEEK') return isThisWeek(d);
      return isThisMonth(d);
    });

    return {
      total: periodOrders.length,
      open: periodOrders.filter(o => o.status === 'OPEN').length,
      paid: periodOrders.filter(o => o.status === 'COMPLETED').length,
      cancelled: periodOrders.filter(o => o.status === 'CANCELLED').length,
    };
  }, [orders, activeDate]);

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-gray-50 relative">
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Buyurtmalar</h2>
            <p className="text-gray-500">Barcha restoran buyurtmalari tarixi va joriy holati</p>
          </div>
          <button 
            onClick={() => navigate('/tables')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-orange-700 transition"
          >
            <Plus size={20} /> Yangi buyurtma
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">Jami</p>
            <p className="text-3xl font-black text-gray-900">{kpiData.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">Ochiq</p>
            <p className="text-3xl font-black text-orange-500">{kpiData.open}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">To'langan</p>
            <p className="text-3xl font-black text-green-500">{kpiData.paid}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">Bekor qilingan</p>
            <p className="text-3xl font-black text-red-500">{kpiData.cancelled}</p>
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
              placeholder="Buyurtma raqami yoki stol..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-medium transition"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
          {(['ALL', 'OPEN', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeStatus === tab ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'ALL' && 'Barchasi'}
              {tab === 'OPEN' && 'Ochiq'}
              {tab === 'COMPLETED' && 'To‘langan'}
              {tab === 'CANCELLED' && 'Bekor qilingan'}
            </button>
          ))}
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
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={64} className="mx-auto text-gray-200 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Buyurtmalar topilmadi</h3>
              <p className="text-gray-500 mb-6">Tanlangan sanada yoki statusda ma'lumot yo'q.</p>
              <button onClick={() => navigate('/tables')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold">Stollarni ko'rish</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4 font-bold">Buyurtma</th>
                    <th className="px-6 py-4 font-bold">Stol</th>
                    <th className="px-6 py-4 font-bold">Summa</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => {
                        if (order.status === 'OPEN' && order.table_id) {
                          navigate(`/tables/${order.table_id}`);
                        } else {
                          setSelectedOrder(order);
                        }
                      }}
                      className="hover:bg-gray-50/80 cursor-pointer transition group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 group-hover:text-primary transition">#ORD-{order.id.toString().padStart(4, '0')}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">Stol {getTableName(order.table_id)}</td>
                      <td className="px-6 py-4 font-black text-gray-900">{order.total_amount.toLocaleString()} so'm</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          order.status === 'OPEN' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'COMPLETED' ? 'bg-green-500' :
                            order.status === 'OPEN' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}></span>
                          {order.status === 'COMPLETED' ? 'To‘langan' : order.status === 'OPEN' ? 'Ochiq' : 'Bekor qilingan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer - Order Detail */}
      {selectedOrder && (
        <div className="absolute inset-0 z-50 flex pointer-events-none">
          <div className="flex-1 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedOrder(null)}></div>
          <div className="w-full max-w-md bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] h-full pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Buyurtma #ORD-{selectedOrder.id.toString().padStart(4, '0')}</h3>
                <p className="text-sm font-medium text-gray-500 mt-0.5">{new Date(selectedOrder.created_at).toLocaleString('uz-UZ')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Manzil</p>
                  <p className="font-bold text-gray-900">Stol {getTableName(selectedOrder.table_id)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    selectedOrder.status === 'OPEN' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedOrder.status === 'COMPLETED' ? 'To‘langan' : selectedOrder.status === 'OPEN' ? 'Ochiq' : 'Bekor qilingan'}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                <span>Taomlar</span>
                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{selectedOrder.items.length} ta</span>
              </h4>
              
              <div className="space-y-4 mb-8">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-gray-500 mt-0.5">{item.unit_price.toLocaleString()} x {item.quantity}</p>
                    </div>
                    <div className="font-bold text-gray-900 text-right min-w-[80px]">
                      {item.subtotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-500 uppercase">Jami summa</span>
                  <span className="text-2xl font-black text-gray-900">{selectedOrder.total_amount.toLocaleString()} <span className="text-sm font-medium text-gray-500">so'm</span></span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
              {selectedOrder.status === 'OPEN' && (
                <>
                  <button 
                    onClick={() => navigate(`/tables/${selectedOrder.table_id}`)}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition"
                  >
                    Buyurtmani davom ettirish
                  </button>
                  <button 
                    onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'CANCELLED' })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full py-3.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition"
                  >
                    Bekor qilish
                  </button>
                </>
              )}
              {selectedOrder.status === 'COMPLETED' && (
                <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition flex items-center justify-center gap-2 shadow-sm">
                  <FileText size={18} /> Chekni ko'rish (Printer)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
