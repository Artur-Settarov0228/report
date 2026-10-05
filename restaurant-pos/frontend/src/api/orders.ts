import { apiClient } from './client';
import { Order } from '../types';

export const createOrder = async (table_id: number): Promise<Order> => {
  const response = await apiClient.post<Order>('/api/v1/orders', { table_id });
  return response.data;
};

export const getOrderByTable = async (table_id: number): Promise<Order | null> => {
  const response = await apiClient.get<Order[]>('/api/v1/orders', { params: { table_id, status: 'OPEN' } });
  return response.data.length > 0 ? response.data[0] : null;
};

export const addOrderItem = async (order_id: number, product_id: number, quantity: number = 1): Promise<Order> => {
  const response = await apiClient.post<Order>(`/api/v1/orders/${order_id}/items`, { product_id, quantity });
  return response.data;
};

export const updateOrderItem = async (order_id: number, item_id: number, quantity: number): Promise<Order> => {
  const response = await apiClient.patch<Order>(`/api/v1/orders/${order_id}/items/${item_id}`, { quantity });
  return response.data;
};

export const removeOrderItem = async (order_id: number, item_id: number): Promise<Order> => {
  const response = await apiClient.delete<Order>(`/api/v1/orders/${order_id}/items/${item_id}`);
  return response.data;
};
