import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/reports';
import { TrendingUp, ShoppingBag, Receipt } from 'lucide-react';

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats
  });

  if (isLoading) {
    return <div className="p-6">Hisobotlar yuklanmoqda...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Hisobotlar</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <div className="bg-green-100 p-4 rounded-full mr-4 text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Bugungi savdo</p>
            <h3 className="text-2xl font-bold text-gray-900">{data?.today_revenue ? data.today_revenue.toLocaleString() : 0} so'm</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <div className="bg-blue-100 p-4 rounded-full mr-4 text-blue-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Buyurtmalar</p>
            <h3 className="text-2xl font-bold text-gray-900">{data?.today_orders_count || 0} ta</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center">
          <div className="bg-purple-100 p-4 rounded-full mr-4 text-purple-600">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">O'rtacha chek</p>
            <h3 className="text-2xl font-bold text-gray-900">{data?.average_check ? data.average_check.toLocaleString() : 0} so'm</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Grafiklar (Tez kunda)</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
          <p className="text-gray-500">Bu yerda savdo grafigi bo'ladi</p>
        </div>
      </div>
    </div>
  );
}
