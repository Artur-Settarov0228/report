import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTables, createTable } from '../api/tables';
import { Link } from 'react-router-dom';
import { Users, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const tableSchema = z.object({
  table_number: z.string().min(1, "Stol raqami kiritilishi shart"),
  seats: z.number().min(1, "O'rindiqlar soni 1 dan kam bo'lmasligi kerak")
});
type TableForm = z.infer<typeof tableSchema>;

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: tables, isLoading, isError } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    refetchInterval: 10000, 
  });

  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowModal(false);
      reset();
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TableForm>({
    resolver: zodResolver(tableSchema),
    defaultValues: { table_number: "", seats: 4 }
  });

  const onSubmit = (data: TableForm) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Stollar</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-red-500">Stollarni yuklashda xatolik yuz berdi.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Stollar</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center transition shadow-sm"
        >
          <Plus size={20} className="mr-1" />
          Yangi Stol
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables?.map((table) => {
          let bgClass = "bg-white border-gray-200 hover:border-gray-300";
          let statusText = "Bo'sh";
          let statusColor = "text-gray-500";
          let dotColor = "bg-gray-300";

          if (table.status === 'OCCUPIED') {
            bgClass = "bg-orange-50 border-orange-200 hover:border-orange-300";
            statusText = "Band (Buyurtma)";
            statusColor = "text-orange-600";
            dotColor = "bg-orange-500";
          } else if (table.status === 'RESERVED') {
            bgClass = "bg-purple-50 border-purple-200 hover:border-purple-300";
            statusText = "Bron qilingan";
            statusColor = "text-purple-600";
            dotColor = "bg-purple-500";
          }

          return (
            <Link 
              key={table.id} 
              to={`/tables/${table.id}`}
              className={`block p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${bgClass}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{table.table_number}</h3>
                <div className="flex items-center text-gray-500 text-sm">
                  <Users size={16} className="mr-1" />
                  {table.seats}
                </div>
              </div>
              <div className="flex items-center">
                <span className={`w-2.5 h-2.5 rounded-full mr-2 ${dotColor}`}></span>
                <span className={`font-medium text-sm ${statusColor}`}>{statusText}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      {tables?.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-500">
          <p className="text-lg font-medium mb-2">Hozircha stollar mavjud emas</p>
          <p className="text-sm">Yuqoridagi "Yangi Stol" tugmasi orqali stollarni kiritib chiqing.</p>
        </div>
      )}

      {/* Add Table Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Yangi Stol Qo'shish</h3>
              <button onClick={() => { setShowModal(false); reset(); }} className="text-gray-400 hover:text-gray-900 transition p-1 bg-gray-50 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stol raqami yoki nomi</label>
                <input 
                  {...register('table_number')} 
                  type="text" 
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.table_number ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Masalan: 1 yoki V12"
                  autoFocus
                />
                {errors.table_number && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.table_number.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">O'rindiqlar soni</label>
                <input 
                  {...register('seats', { valueAsNumber: true })} 
                  type="number" 
                  min="1"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition ${errors.seats ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.seats && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.seats.message}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); reset(); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-orange-700 font-bold disabled:opacity-70 transition flex items-center justify-center min-w-[120px]"
                >
                  {createMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
