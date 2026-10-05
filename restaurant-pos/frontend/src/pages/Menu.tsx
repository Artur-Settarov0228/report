import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../api/categories';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, UtensilsCrossed } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, "Nomi kiritilishi shart"),
  category_id: z.number().min(1, "Kategoriyani tanlang"),
  price: z.number().min(0, "Narxi noldan katta bo'lishi kerak"),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  unit: z.string().default("PIECE"),
  sku: z.string().min(1, "SKU majburiy")
});

const categorySchema = z.object({
  name: z.string().min(1, "Kategoriya nomi kiritilishi shart"),
});

export default function Menu() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Editing state
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'all' || p.category_id === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Mutations
  const createProdMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeProductModal(); }
  });
  const updateProdMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeProductModal(); }
  });
  const deleteProdMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setDeleteConfirmOpen(false); }
  });
  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCategoryModalOpen(false); resetCat(); }
  });

  const { register: regProd, handleSubmit: submitProd, reset: resetProd, formState: { errors: errProd }, setValue: setProdValue } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', category_id: 0, price: 0, image_url: '', is_active: true, unit: 'PIECE', sku: 'SKU' + Math.floor(Math.random() * 10000) }
  });

  const { register: regCat, handleSubmit: submitCat, reset: resetCat, formState: { errors: errCat } } = useForm({
    resolver: zodResolver(categorySchema)
  });

  const openProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProdValue('name', product.name);
      setProdValue('category_id', product.category_id);
      setProdValue('price', product.price);
      setProdValue('image_url', product.image_url || '');
      setProdValue('is_active', product.is_active);
      setProdValue('unit', product.unit);
      setProdValue('sku', product.sku);
    } else {
      setEditingProduct(null);
      resetProd({ name: '', category_id: categories.length > 0 ? categories[0].id : 0, price: 0, image_url: '', is_active: true, unit: 'PIECE', sku: 'SKU' + Math.floor(Math.random() * 10000) });
    }
    setProductModalOpen(true);
  };

  const closeProductModal = () => { setProductModalOpen(false); resetProd(); };

  const onProductSubmit = (data: any) => {
    if (editingProduct) {
      updateProdMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProdMutation.mutate(data);
    }
  };

  const onCategorySubmit = (data: any) => {
    createCatMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Menyu</h2>
        <div className="flex gap-3">
          <button onClick={() => setCategoryModalOpen(true)} className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 font-bold transition flex items-center shadow-sm">
            <Plus size={18} className="mr-1" /> Kategoriya
          </button>
          <button onClick={() => openProductModal()} className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-orange-700 font-bold transition flex items-center shadow-md">
            <Plus size={20} className="mr-1" /> Mahsulot
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-medium"
            placeholder="Mahsulot qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2.5 rounded-xl whitespace-nowrap font-bold transition-all ${
              activeCategory === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Barchasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-xl whitespace-nowrap font-bold transition-all ${
                activeCategory === cat.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <UtensilsCrossed size={64} className="mx-auto text-gray-200 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Mahsulot topilmadi</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Ushbu kategoriyada yoki qidiruvda hech narsa chiqmadi. Yangi mahsulot qo'shing.</p>
          <button onClick={() => openProductModal()} className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-700 shadow-md transition-colors">Yangi mahsulot qo'shish</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => {
            const catName = categories.find(c => c.id === product.category_id)?.name || '';
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex-shrink-0 border-b border-gray-100">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                      <ImageIcon size={64} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                    <button onClick={() => openProductModal(product)} className="w-12 h-12 flex items-center justify-center bg-white text-gray-900 rounded-full hover:bg-gray-100 hover:scale-110 transition-transform shadow-lg"><Edit2 size={20} /></button>
                    <button onClick={() => { setDeletingProduct(product); setDeleteConfirmOpen(true); }} className="w-12 h-12 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-transform shadow-lg"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">{catName}</div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-3 flex-1">{product.name}</h3>
                  <div className="flex items-end justify-between mt-auto">
                    <div className="font-black text-xl text-gray-900">{(product.price).toLocaleString()} <span className="text-sm font-bold text-gray-400">so'm</span></div>
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {product.is_active ? 'Mavjud' : 'Tugagan'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">{editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi Mahsulot'}</h3>
              <button onClick={closeProductModal} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition"><X size={24} /></button>
            </div>
            <form onSubmit={submitProd(onProductSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mahsulot nomi</label>
                <input {...regProd('name')} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none font-medium" placeholder="Masalan: Osh, Kofe..." />
                {errProd.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{String(errProd.name.message)}</p>}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Kategoriya</label>
                  <select {...regProd('category_id', { valueAsNumber: true })} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none bg-white font-medium cursor-pointer">
                    <option value={0} disabled>Tanlang...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errProd.category_id && <p className="text-red-500 text-xs mt-1.5 font-medium">{String(errProd.category_id.message)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Narxi (so'm)</label>
                  <input type="number" {...regProd('price', { valueAsNumber: true })} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none font-medium" />
                  {errProd.price && <p className="text-red-500 text-xs mt-1.5 font-medium">{String(errProd.price.message)}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rasm havolasi (URL)</label>
                <input {...regProd('image_url')} placeholder="https://..." className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none font-medium" />
              </div>
              <div className="flex items-center gap-3 pt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <input type="checkbox" id="is_active" {...regProd('is_active')} className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300 cursor-pointer" />
                <label htmlFor="is_active" className="font-bold text-gray-700 cursor-pointer select-none">Mijozlar buyurtma bera oladi (Mavjud)</label>
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={closeProductModal} className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition">Bekor qilish</button>
                <button type="submit" disabled={createProdMutation.isPending || updateProdMutation.isPending} className="px-8 py-3.5 bg-primary text-white rounded-xl hover:bg-orange-700 font-bold shadow-md transition disabled:opacity-70">
                  {editingProduct ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Yangi Kategoriya</h3>
            <form onSubmit={submitCat(onCategorySubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kategoriya nomi</label>
                <input {...regCat('name')} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none font-medium" autoFocus placeholder="Masalan: Ichimliklar" />
                {errCat.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{String(errCat.name.message)}</p>}
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">Bekor qilish</button>
                <button type="submit" disabled={createCatMutation.isPending} className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black shadow-md transition disabled:opacity-70">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && deletingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
              <Trash2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">O'chirishni tasdiqlaysizmi?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">"<span className="font-bold text-gray-900">{deletingProduct.name}</span>" mahsuloti tizimdan butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirmOpen(false)} className="px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 flex-1 transition">Yo'q, qolsin</button>
              <button onClick={() => deleteProdMutation.mutate(deletingProduct.id)} disabled={deleteProdMutation.isPending} className="px-6 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 flex-1 shadow-md transition disabled:opacity-70">Ha, o'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
