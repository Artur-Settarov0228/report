import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { getOrderByTable, createOrder, addOrderItem, removeOrderItem, updateOrderItem, updateOrderStatus } from '../api/orders';
import { createPayment } from '../api/payments';
import { Trash2, ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Order, Product } from '../types';

export default function TableDetails() {
  const { id } = useParams<{ id: string }>();
  const tableId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "CLICK" | "PAYME">("CASH");

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  // Fetch Products
  const { data: products } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => getProducts(selectedCategory || undefined)
  });

  // Fetch or Create Order
  const { data: order } = useQuery({
    queryKey: ['order', tableId],
    queryFn: () => getOrderByTable(tableId)
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: () => createOrder(tableId),
    onSuccess: (data) => queryClient.setQueryData(['order', tableId], data)
  });

  const addItemMutation = useMutation({
    mutationFn: ({ orderId, productId }: { orderId: number, productId: number }) => 
      addOrderItem(orderId, productId, 1),
    onMutate: async ({ productId }) => {
      await queryClient.cancelQueries({ queryKey: ['order', tableId] });
      const previousOrder = queryClient.getQueryData<Order>(['order', tableId]);
      
      if (previousOrder) {
        const product = products?.find((p: Product) => p.id === productId);
        if (!product) return { previousOrder };

        const newOrder = { ...previousOrder, items: [...previousOrder.items] };
        const existingItemIndex = newOrder.items.findIndex(i => i.product_id === productId);
        
        if (existingItemIndex >= 0) {
          const item = { ...newOrder.items[existingItemIndex] };
          item.quantity += 1;
          item.subtotal = Number(item.quantity) * Number(item.unit_price);
          newOrder.items[existingItemIndex] = item;
        } else {
          newOrder.items.push({
            id: Date.now(),
            order_id: previousOrder.id,
            product_id: productId,
            product_name: product.name,
            quantity: 1,
            unit_price: product.price,
            subtotal: product.price
          });
        }
        
        queryClient.setQueryData(['order', tableId], newOrder);
      }
      return { previousOrder };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', tableId], context.previousOrder);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['order', tableId] });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, quantity }: { orderId: number, itemId: number, quantity: number }) => 
      updateOrderItem(orderId, itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['order', tableId] });
      const previousOrder = queryClient.getQueryData<Order>(['order', tableId]);
      
      if (previousOrder) {
        const newOrder = { ...previousOrder, items: previousOrder.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity,
              subtotal: quantity * Number(item.unit_price)
            };
          }
          return item;
        }) };
        queryClient.setQueryData(['order', tableId], newOrder);
      }
      return { previousOrder };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', tableId], context.previousOrder);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['order', tableId] });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number, itemId: number }) => 
      removeOrderItem(orderId, itemId),
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['order', tableId] });
      const previousOrder = queryClient.getQueryData<Order>(['order', tableId]);
      
      if (previousOrder) {
        const newOrder = { ...previousOrder, items: previousOrder.items.filter(i => i.id !== itemId) };
        queryClient.setQueryData(['order', tableId], newOrder);
      }
      return { previousOrder };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', tableId], context.previousOrder);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['order', tableId] });
    }
  });

  const paymentMutation = useMutation({
    mutationFn: () => createPayment(order!.id, order!.total_amount, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', tableId] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setShowPayment(false);
      navigate('/dashboard');
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => updateOrderStatus(order!.id, "CANCELLED"),
    onSuccess: () => {
      queryClient.setQueryData(['order', tableId], null);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate('/tables');
    }
  });

  const handleAddProduct = (productId: number) => {
    if (!order) {
      if (createOrderMutation.isPending) return;
      createOrderMutation.mutate(undefined, {
        onSuccess: (newOrder) => addItemMutation.mutate({ orderId: newOrder.id, productId })
      });
    } else {
      addItemMutation.mutate({ orderId: order.id, productId });
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Left: MENU */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 mr-4 bg-white rounded-lg shadow-sm hover:bg-gray-50">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">Stol {tableId} - Menyu</h2>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide flex-shrink-0">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition ${!selectedCategory ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Barchasi
          </button>
          {categories?.filter(c => c.is_active).map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition ${selectedCategory === c.id ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products?.filter(p => p.is_active).map(p => (
              <div 
                key={p.id} 
                onClick={() => handleAddProduct(p.id)}
                className="bg-white p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-primary cursor-pointer transition flex flex-col items-center text-center select-none"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full mb-3 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                     <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 font-bold text-xl">{p.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 leading-tight mb-1">{p.name}</h3>
                <p className="text-primary font-bold">{Number(p.price).toLocaleString('ru-RU')} so'm</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: ORDER CART */}
      <div className="w-full md:w-96 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-10 h-full">
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">Buyurtma {order ? `#${order.id}` : ''}</h2>
          <p className="text-sm text-gray-500">Stol {tableId}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!order || order.items.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
              <p>Savat bo'sh.<br/>Mahsulot ustiga bosib qo'shing.</p>
            </div>
          ) : (
            order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-medium text-gray-900 truncate">{item.product_name}</h4>
                  <p className="text-sm text-gray-500">{Number(item.unit_price).toLocaleString('ru-RU')} so'm</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white rounded-md border border-gray-200 p-1">
                    <button 
                      onClick={() => updateItemMutation.mutate({ orderId: order.id, itemId: item.id, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1 || updateItemMutation.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 font-bold"
                    >-</button>
                    <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateItemMutation.mutate({ orderId: order.id, itemId: item.id, quantity: item.quantity + 1 })}
                      disabled={updateItemMutation.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 font-bold"
                    >+</button>
                  </div>
                  <p className="font-bold text-gray-900 w-24 text-right text-lg">{Number(item.subtotal).toLocaleString('ru-RU')}</p>
                  <button 
                    onClick={() => removeItemMutation.mutate({ orderId: order.id, itemId: item.id })}
                    disabled={removeItemMutation.isPending}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-50 shadow-sm border border-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-gray-600">Jami summasi</span>
            <span className="text-2xl font-bold text-gray-900">
              {order?.items ? order.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toLocaleString('ru-RU') : 0} <span className="text-sm text-gray-500 font-normal">so'm</span>
            </span>
          </div>
          
          <div className="flex gap-2 mb-3">
            <button 
              onClick={() => navigate('/tables')}
              className="flex-1 bg-white border-2 border-primary text-primary hover:bg-orange-50 font-bold py-4 rounded-xl shadow-sm transition text-lg active:scale-[0.98]"
            >
              Saqlash
            </button>
            <button 
              onClick={() => {
                if (window.confirm("Buyurtmani bekor qilishni xohlaysizmi?")) {
                  cancelOrderMutation.mutate();
                }
              }}
              disabled={!order || cancelOrderMutation.isPending}
              className="flex-1 bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold py-4 rounded-xl shadow-sm transition text-lg active:scale-[0.98] disabled:opacity-50"
            >
              Bekor qilish
            </button>
          </div>
          
          <button 
            onClick={() => setShowPayment(true)}
            disabled={!order || order.items.length === 0 || createOrderMutation.isPending || addItemMutation.isPending}
            className="w-full bg-primary hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed text-lg active:scale-[0.98]"
          >
            To'lovni amalga oshirish
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && order && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gray-50 border-b text-center">
              <h2 className="text-2xl font-bold">To'lov</h2>
              <p className="text-gray-500">Buyurtma #{order.id}</p>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-sm text-gray-500 mb-1">To'lanadigan summa</p>
                <p className="text-4xl font-bold text-gray-900">{order?.items ? order.items.reduce((sum, item) => sum + Number(item.subtotal), 0).toLocaleString('ru-RU') : 0} <span className="text-lg text-gray-500">so'm</span></p>
              </div>

              <p className="font-medium text-gray-700 mb-3">To'lov usuli</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {(['CASH', 'CARD', 'CLICK', 'PAYME'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3.5 rounded-xl border-2 font-medium transition ${paymentMethod === method ? 'border-primary bg-orange-50 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {method === 'CASH' && 'Naqd pul'}
                    {method === 'CARD' && 'Karta'}
                    {method === 'CLICK' && 'Click'}
                    {method === 'PAYME' && 'Payme'}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentMutation.isPending}
                  className="flex-[2] py-4 bg-primary hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-70 active:scale-[0.98]"
                >
                  {paymentMutation.isPending ? 'Kutib turing...' : <><CheckCircle size={20}/> Tasdiqlash</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
