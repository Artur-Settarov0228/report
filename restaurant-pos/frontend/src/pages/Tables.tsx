import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTables, createTable, updateTable, deleteTable } from '../api/tables';
import { getAllOrders } from '../api/orders';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, Search, Clock, Edit2, Trash2, MoreVertical, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Table, Order } from '../types';

const tableSchema = z.object({
  table_number: z.string().min(1, "Stol raqami kiritilishi shart"),
  seats: z.number().min(1, "O'rindiqlar soni kamida 1 bo'lishi kerak")
});
type TableForm = z.infer<typeof tableSchema>;

type TableFilter = 'ALL' | 'FREE' | 'OCCUPIED';

export default function Tables() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState<TableFilter>('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Queries
  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    refetchInterval: 5000, 
  });

  const { data: activeOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: () => getAllOrders({ status: 'OPEN' }),
    refetchInterval: 5000, 
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowAddModal(false);
      addForm.reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: TableForm }) => updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setEditingTable(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setActiveMenuId(null);
    }
  });

  // Forms
  const addForm = useForm<TableForm>({
    resolver: zodResolver(tableSchema),
    defaultValues: { table_number: "", seats: 4 }
  });

  const editForm = useForm<TableForm>({
    resolver: zodResolver(tableSchema)
  });

  // Data processing
  const enrichedTables = useMemo(() => {
    return tables.map(table => {
      const currentOrder = activeOrders.find(o => o.table_id === table.id);
      return {
        ...table,
        currentOrder,
        isOccupied: !!currentOrder
      };
    });
  }, [tables, activeOrders]);

  const filteredTables = useMemo(() => {
    return enrichedTables.filter(table => {
      if (filter === 'FREE' && table.isOccupied) return false;
      if (filter === 'OCCUPIED' && !table.isOccupied) return false;
      
      if (search) {
        const q = search.toLowerCase();
        return table.table_number.toLowerCase().includes(q);
      }
      return true;
    });
  }, [enrichedTables, filter, search]);

  const stats = useMemo(() => {
    return {
      total: tables.length,
      free: enrichedTables.filter(t => !t.isOccupied).length,
      occupied: enrichedTables.filter(t => t.isOccupied).length
    };
  }, [tables, enrichedTables]);

  const handleDelete = (tableId: number, isOccupied: boolean) => {
    if (isOccupied) {
      alert("Bu stolda faol buyurtma mavjud! Stolni o'chirish uchun avval buyurtmani yoping.");
      return;
    }
    if (confirm("Haqiqatan ham bu stolni o'chirmoqchimisiz?")) {
      deleteMutation.mutate(tableId);
    }
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    editForm.reset({ table_number: table.table_number, seats: table.seats || 4 });
    setActiveMenuId(null);
  };

  if (loadingTables || loadingOrders) {
    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-8">Stollar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col bg-gray-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-6 md:p-8" onClick={() => setActiveMenuId(null)}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Stollar</h2>
            <p className="text-gray-500">Restorandagi stollar va joriy buyurtmalar</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition"
          >
            <Plus size={20} /> Stol qo'shish
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Jami</p>
            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-green-600 mb-1 uppercase tracking-wider">Bo'sh</p>
            <p className="text-3xl font-black text-gray-900">{stats.free}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-orange-600 mb-1 uppercase tracking-wider">Band</p>
            <p className="text-3xl font-black text-gray-900">{stats.occupied}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full xl:w-auto">
            <button onClick={() => setFilter('ALL')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition ${filter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Barchasi</button>
            <button onClick={() => setFilter('FREE')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition ${filter === 'FREE' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Bo'sh</button>
            <button onClick={() => setFilter('OCCUPIED')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition ${filter === 'OCCUPIED' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Band</button>
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Stol raqami bo'yicha qidirish..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-bold text-gray-700 transition"
            />
          </div>
        </div>

        {/* Grid */}
        {filteredTables.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stollar topilmadi</h3>
            <p className="text-gray-500 font-medium">Boshqa filtr tanlang yoki yangi stol qo'shing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredTables.map(table => (
              <div 
                key={table.id}
                className={`relative group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-2 cursor-pointer transform hover:-translate-y-1 ${
                  table.isOccupied ? 'border-orange-200' : 'border-transparent hover:border-gray-200'
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.menu-btn')) return;
                  navigate(`/tables/${table.id}`);
                }}
              >
                {/* Status Indicator Bar */}
                <div className={`h-2 w-full ${table.isOccupied ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{table.table_number}</h3>
                    
                    {/* Menu Button */}
                    <div className="relative menu-btn">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === table.id ? null : table.id); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {activeMenuId === table.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModal(table); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 size={16} /> Tahrirlash
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(table.id, table.isOccupied); }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={16} /> O'chirish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {table.isOccupied && table.currentOrder ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        BAND
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold text-sm mb-0.5">#ORD-{table.currentOrder.id.toString().padStart(4, '0')}</p>
                        <p className="text-2xl font-black text-gray-900">{Number(table.currentOrder.total_amount).toLocaleString('ru-RU').replace(',', ' ')} <span className="text-sm text-gray-500">so'm</span></p>
                      </div>
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-bold">
                          <FileText size={16} /> {table.currentOrder.items.reduce((sum, item) => sum + item.quantity, 0)} ta
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-bold">
                          <Clock size={16} /> {format(new Date(table.currentOrder.created_at), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        BO'SH
                      </div>
                      <div className="pt-8 pb-4">
                        <p className="text-gray-400 font-bold mb-4">{table.seats} o'rinli</p>
                        <div className="inline-flex items-center gap-2 text-primary font-bold">
                          <Plus size={20} /> Buyurtma ochish
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Yangi Stol Qo'shish</h3>
            <form onSubmit={addForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Stol raqami yoki nomi</label>
                <input 
                  {...addForm.register('table_number')} 
                  type="text" 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-bold transition"
                  placeholder="Masalan: 1 yoki VIP-2"
                  autoFocus
                />
                {addForm.formState.errors.table_number && <p className="text-red-500 text-xs mt-1.5 font-bold">{addForm.formState.errors.table_number.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">O'rindiqlar soni</label>
                <input 
                  {...addForm.register('seats', { valueAsNumber: true })} 
                  type="number" min="1"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-bold transition"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition">Bekor qilish</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black font-bold disabled:opacity-70 transition">
                  {createMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Stolni Tahrirlash</h3>
            <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: editingTable.id, data }))} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Stol raqami yoki nomi</label>
                <input 
                  {...editForm.register('table_number')} 
                  type="text" 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-bold transition"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">O'rindiqlar soni</label>
                <input 
                  {...editForm.register('seats', { valueAsNumber: true })} 
                  type="number" min="1"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-bold transition"
                />
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setEditingTable(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition">Bekor qilish</button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-3.5 bg-primary text-white rounded-xl hover:bg-orange-700 font-bold disabled:opacity-70 transition">
                  {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
