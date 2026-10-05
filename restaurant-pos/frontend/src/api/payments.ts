import { apiClient } from './client';
import { Payment } from '../types';

export const createPayment = async (order_id: number, amount: number, method: string): Promise<Payment> => {
  const response = await apiClient.post<Payment>('/api/v1/payments', { order_id, amount, method });
  return response.data;
};
